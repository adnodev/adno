import { normalizeAngle, resolveRotation, shortestDelta } from "./orientation"
import { getAnnotationCutout } from "./cutout"
import { annotationShapes } from "./utils"
import { parseShadowId, unionBoxes } from "./targets"
import { groupBox, groupRotation, groupShadows } from "./groups"

export const CROSS_ORIGIN = 'Anonymous'

const PENDING_TURN = 'adnoPendingTurn'
const LAST_VIEW = 'adnoLastView'
const PAN_TIMEOUT = 1500
const ANGLE_EPSILON = 0.5
const BOUNDS_PADDING = 0.08
const GROUP_PADDING = 0.06
const TILE_CACHE = 40

function prefersReducedMotion() {
    return typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isSettled(viewport) {
    return viewport.centerSpringX.isAtTargetValue()
        && viewport.centerSpringY.isAtTargetValue()
        && viewport.zoomSpring.isAtTargetValue()
}

export function annotationBounds(viewer, annotationId, padding = 0, only = null) {
    const wanted = parseShadowId(annotationId).id

    const boxes = annotationShapes(viewer.element)
        .filter(item => parseShadowId(item.getAttribute('data-id')).id === wanted)
        .filter(item => !only || only.includes(item.getAttribute('data-id')))
        .filter(item => typeof item.getBBox === "function")
        .map(item => item.getBBox())
        .filter(box => box.width && box.height)

    const box = unionBoxes(boxes)

    if (!box) {
        return null
    }

    const marginX = box.width * padding
    const marginY = box.height * padding

    return viewer.viewport.imageToViewportRectangle(
        box.x - marginX,
        box.y - marginY,
        box.width + marginX * 2,
        box.height + marginY * 2
    )
}

function cancelPendingTurn(viewer) {
    const pending = viewer[PENDING_TURN]

    if (pending) {
        viewer.removeHandler('animation-finish', pending.turn)
        clearTimeout(pending.timer)
        viewer[PENDING_TURN] = null
    }
}

export function applyAnnotationView(viewer, annotorious, annotation, options = {}) {
    const { defaultRotation = 0, transition = "turn", padded = false, only = null } = options
    const viewport = viewer.viewport

    cancelPendingTurn(viewer)

    viewer[LAST_VIEW] = { annotation, options }

    const bounds = annotationBounds(viewer, annotation.id, padded ? BOUNDS_PADDING : 0, only)

    if (!bounds) {
        annotorious.fitBounds(annotation.id)
        return
    }

    const wanted = getAnnotationCutout(annotation)
        ? normalizeAngle(defaultRotation || 0)
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
        if (!viewer[PENDING_TURN]) {
            return
        }

        cancelPendingTurn(viewer)
        viewport.setRotation(target, false)
        viewport.fitBounds(bounds, false)
    }

    viewport.fitBounds(bounds, false)

    if (isSettled(viewport)) {
        turn()
        return
    }

    viewer[PENDING_TURN] = { turn, timer: setTimeout(turn, PAN_TIMEOUT) }
    viewer.addOnceHandler('animation-finish', turn)
}

export function reapplyAnnotationView(viewer, annotorious) {
    const last = viewer[LAST_VIEW]

    if (!last) {
        return
    }

    applyAnnotationView(viewer, annotorious, last.annotation, { ...last.options, transition: "instant" })
}

export function watchViewerResize(viewer, annotorious) {
    let frame = null

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

export function frameGroup(viewer, annotorious, annotation, groupId) {
    const box = groupBox(annotation, groupId)

    if (!viewer || !viewer.isOpen() || !box) {
        return false
    }

    annotorious.setAnnotations(groupShadows(annotation, groupId))

    const marginX = box.width * GROUP_PADDING
    const marginY = box.height * GROUP_PADDING
    const viewport = viewer.viewport

    viewport.setRotation(groupRotation(annotation, groupId) || 0, true)
    viewport.fitBounds(viewport.imageToViewportRectangle(
        box.x - marginX,
        box.y - marginY,
        box.width + marginX * 2,
        box.height + marginY * 2
    ), true)

    return true
}

export function mountReadOnlyViewer(elementId, tileSources, crossOriginPolicy, options) {
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
