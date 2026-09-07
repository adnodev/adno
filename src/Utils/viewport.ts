import { normalizeAngle, resolveRotation, shortestDelta } from "./orientation"
import { getGroupCutout } from "./cutout"
import { annotationShapes } from "./utils"
import { getTargets, parseShadowId, unionBoxes, type Annotation, type Box, type ShadowAnnotation, type ShadowId } from "./targets"
import { groupBox, groupRotation, groupShadows, targetGroupId, type GroupId } from "./groups"
import type { TileSource } from "./images"
import type { RotationTransition } from "./project"

export const CROSS_ORIGIN = 'Anonymous'

const PAN_TIMEOUT = 1500
const ANGLE_EPSILON = 0.5
const BOUNDS_PADDING = 0.08
const GROUP_PADDING = 0.06
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
    imageToViewportRectangle(x: number, y: number, width: number, height: number): ViewportRect
}

export type Viewer = {
    element: Element,
    viewport: OsdViewport,
    isOpen(): boolean,
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
    Annotorious(viewer: Viewer, options: Record<string, unknown>): Annotorious
}

const pendingTurns = new WeakMap<Viewer, PendingTurn>()
const lastViews = new WeakMap<Viewer, LastView>()

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
        .filter(item => parseShadowId(item.getAttribute('data-id')).id === wanted)
        .filter(item => !shadowIds || shadowIds.includes(item.getAttribute('data-id')))
        .filter(item => typeof item.getBBox === "function")
        .map(item => item.getBBox())
        .filter(box => box.width && box.height)

    const box = unionBoxes(boxes)

    if (!box) {
        return null
    }

    return paddedRect(viewer.viewport, box, padding)
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
