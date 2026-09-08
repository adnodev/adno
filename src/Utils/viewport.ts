import { normalizeAngle, resolveRotation, shortestDelta } from "./orientation"
import { getGroupCutout } from "./cutout"
import { annotationShapes } from "./utils"
import { getTargets, parseShadowId, unionBoxes, type Annotation, type Box, type ShadowAnnotation, type ShadowId } from "./targets"
import { groupBox, groupRotation, groupShadows, shapeId, targetGroupId, type GroupId } from "./groups"
import type { TileSource } from "./images"
import type { RotationTransition } from "./project"

export const CROSS_ORIGIN = 'Anonymous'

const PAN_TIMEOUT = 1500
const ANGLE_EPSILON = 0.5
const BOUNDS_PADDING = 0.08
const GROUP_PADDING = 0.06
const EXIT_MARGIN = 40
const TILE_CACHE = 40

type Spring = {
    isAtTargetValue(): boolean
}

type ViewportRect = {
    x: number,
    y: number,
    width: number,
    height: number
}

type OsdViewport = {
    centerSpringX: Spring,
    centerSpringY: Spring,
    zoomSpring: Spring,
    getRotation(): number,
    setRotation(degrees: number, immediately?: boolean): void,
    fitBounds(bounds: ViewportRect, immediately?: boolean): void,
    getBounds(): ViewportRect,
    panTo(center: { x: number, y: number }, immediately?: boolean): void,
    viewportToViewerElementRectangle(rect: ViewportRect): ViewportRect,
    imageToViewportRectangle(x: number, y: number, width: number, height: number): ViewportRect
}

export type Viewer = {
    element: Element,
    viewport: OsdViewport,
    isOpen(): boolean,
    addOverlay(options: { element: HTMLElement, location: ViewportRect }): void,
    updateOverlay(element: HTMLElement, location: ViewportRect): void,
    removeOverlay(element: HTMLElement): void,
    addHandler(event: string, handler: () => void): void,
    addOnceHandler(event: string, handler: () => void): void,
    removeHandler(event: string, handler: () => void): void,
    destroy(): void
}

export type Annotorious = {
    fitBounds(shadowedId: ShadowId): void,
    setAnnotations(annotations: ShadowAnnotation[]): void,
    destroy(): void
}

export type ViewOptions = {
    defaultRotation?: number,
    transition?: RotationTransition,
    padded?: boolean,
    shadowIds?: ShadowId[] | null
}

type PendingTurn = {
    turn: () => void,
    timer: ReturnType<typeof setTimeout>
}

type LastView = {
    annotation: Annotation,
    options: ViewOptions
}

declare const OpenSeadragon: {
    (options: Record<string, unknown>): Viewer,
    Annotorious(viewer: Viewer, options: Record<string, unknown>): Annotorious,
    Rect: new (x: number, y: number, width: number, height: number) => ViewportRect
}

const pendingTurns = new WeakMap<Viewer, PendingTurn>()
const lastViews = new WeakMap<Viewer, LastView>()
const workspaces = new WeakMap<Viewer, HTMLElement>()

function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isSettled(viewport: OsdViewport): boolean {
    return viewport.centerSpringX.isAtTargetValue()
        && viewport.centerSpringY.isAtTargetValue()
        && viewport.zoomSpring.isAtTargetValue()
}

function paddedRect(viewport: OsdViewport, box: Box, padding: number): ViewportRect {
    const marginX = box.width * padding
    const marginY = box.height * padding

    return viewport.imageToViewportRectangle(
        box.x - marginX,
        box.y - marginY,
        box.width + marginX * 2,
        box.height + marginY * 2
    )
}

function annotationBounds(viewer: Viewer, annotationId: ShadowId, padding = 0, shadowIds: ShadowId[] | null = null): ViewportRect | null {
    const wanted = parseShadowId(annotationId).id

    const boxes = annotationShapes(viewer.element)
        .filter(item => parseShadowId(shapeId(item)).id === wanted)
        .filter(item => !shadowIds || shadowIds.includes(shapeId(item)))
        .filter(item => typeof item.getBBox === "function")
        .map(item => item.getBBox())
        .filter(box => box.width && box.height)

    const box = unionBoxes(boxes)

    if (!box) {
        return null
    }

    return paddedRect(viewer.viewport, box, padding)
}

function overlaps(a: ViewportRect, b: ViewportRect): boolean {
    return a.x < b.x + b.width
        && b.x < a.x + a.width
        && a.y < b.y + b.height
        && b.y < a.y + a.height
}

export function revealAnnotation(viewer: Viewer, annotationId: ShadowId, shadowIds: ShadowId[] | null = null): void {
    const bounds = annotationBounds(viewer, annotationId, 0, shadowIds)

    if (!bounds || overlaps(bounds, viewer.viewport.getBounds())) {
        return
    }

    viewer.viewport.panTo({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
    })
}

export function isInsideAnnotation(viewer: Viewer, annotationId: ShadowId, pixel: { x: number, y: number }): boolean {
    const bounds = annotationBounds(viewer, annotationId)

    if (!bounds) {
        return false
    }

    const rect = viewer.viewport.viewportToViewerElementRectangle(bounds)

    return pixel.x >= rect.x - EXIT_MARGIN
        && pixel.x <= rect.x + rect.width + EXIT_MARGIN
        && pixel.y >= rect.y - EXIT_MARGIN
        && pixel.y <= rect.y + rect.height + EXIT_MARGIN
}

export function showWorkspace(viewer: Viewer, annotationId: ShadowId): void {
    const bounds = annotationBounds(viewer, annotationId)

    if (!bounds) {
        hideWorkspace(viewer)
        return
    }

    const location = new OpenSeadragon.Rect(bounds.x, bounds.y, bounds.width, bounds.height)
    const existing = workspaces.get(viewer)

    if (existing) {
        viewer.updateOverlay(existing, location)
        return
    }

    const element = document.createElement('div')

    element.className = 'workspace-frame'
    element.style.setProperty('--exit-margin', `${EXIT_MARGIN}px`)

    viewer.addOverlay({ element, location })
    workspaces.set(viewer, element)
}

export function hideWorkspace(viewer: Viewer): void {
    const element = workspaces.get(viewer)

    if (!element) {
        return
    }

    viewer.removeOverlay(element)
    workspaces.delete(viewer)
}

function cancelPendingTurn(viewer: Viewer): void {
    const pending = pendingTurns.get(viewer)

    if (pending) {
        viewer.removeHandler('animation-finish', pending.turn)
        clearTimeout(pending.timer)
        pendingTurns.delete(viewer)
    }
}

export function applyAnnotationView(viewer: Viewer, annotorious: Annotorious, annotation: Annotation, options: ViewOptions = {}): void {
    const { defaultRotation = 0, transition = "turn", padded = false, shadowIds = null } = options
    const viewport = viewer.viewport

    cancelPendingTurn(viewer)

    lastViews.set(viewer, { annotation, options })

    const bounds = annotationBounds(viewer, annotation.id, padded ? BOUNDS_PADDING : 0, shadowIds)

    if (!bounds) {
        annotorious.fitBounds(annotation.id)
        return
    }

    const activeGroup = targetGroupId(getTargets(annotation)[0])

    const wanted = getGroupCutout(annotation, activeGroup)
        ? normalizeAngle(defaultRotation)
        : resolveRotation(annotation, defaultRotation)

    const current = viewport.getRotation()
    const delta = shortestDelta(current, wanted)

    if (Math.abs(delta) < ANGLE_EPSILON) {
        viewport.fitBounds(bounds, false)
        return
    }

    const target = current + delta

    if (transition === "instant" || prefersReducedMotion()) {
        viewport.setRotation(target, true)
        viewport.fitBounds(bounds, true)
        return
    }

    const turn = () => {
        if (!pendingTurns.has(viewer)) {
            return
        }

        cancelPendingTurn(viewer)
        viewport.setRotation(target, false)
        viewport.fitBounds(bounds, false)
    }

    viewport.fitBounds(bounds, false)
    pendingTurns.set(viewer, { turn, timer: setTimeout(turn, PAN_TIMEOUT) })

    if (isSettled(viewport)) {
        turn()
        return
    }

    viewer.addOnceHandler('animation-finish', turn)
}

function reapplyAnnotationView(viewer: Viewer, annotorious: Annotorious): void {
    const last = lastViews.get(viewer)

    if (!last) {
        return
    }

    applyAnnotationView(viewer, annotorious, last.annotation, { ...last.options, transition: "instant" })
}

export function watchViewerResize(viewer: Viewer, annotorious: Annotorious): () => void {
    let frame = 0

    const reframe = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => reapplyAnnotationView(viewer, annotorious))
    }

    viewer.addHandler('after-resize', reframe)

    return () => {
        cancelAnimationFrame(frame)
        viewer.removeHandler('after-resize', reframe)
    }
}

export function frameGroup(viewer: Viewer, annotorious: Annotorious, annotation: Annotation, groupId: GroupId, options: { defaultRotation?: number } = {}): boolean {
    const { defaultRotation = 0 } = options
    const box = groupBox(annotation, groupId)

    if (!viewer || !viewer.isOpen() || !box) {
        return false
    }

    annotorious.setAnnotations(groupShadows(annotation, groupId))

    const rotation = groupRotation(annotation, groupId)
    const viewport = viewer.viewport

    viewport.setRotation(rotation === null ? normalizeAngle(defaultRotation) : rotation, true)
    viewport.fitBounds(paddedRect(viewport, box, GROUP_PADDING), true)

    return true
}

export function mountReadOnlyViewer(elementId: string, tileSources: TileSource | null, crossOriginPolicy: string | false | undefined, options: Record<string, unknown>): { viewer: Viewer, annotorious: Annotorious } {
    const viewer = OpenSeadragon({
        id: elementId,
        tileSources,
        crossOriginPolicy: crossOriginPolicy ?? CROSS_ORIGIN,
        showNavigationControl: false,
        maxImageCacheCount: TILE_CACHE
    })

    const annotorious = OpenSeadragon.Annotorious(viewer, {
        readOnly: true,
        disableEditor: true,
        ...options
    })

    return { viewer, annotorious }
}
