import { normalizeAngle, resolveRotation, shortestDelta } from "./orientation"
import { getAnnotationCutout } from "./cutout"
import { annotationShapes } from "./utils"

const PENDING_TURN = "adnoPendingTurn"
const LAST_VIEW = "adnoLastView"
const PAN_TIMEOUT = 1500
const ANGLE_EPSILON = 0.5

function prefersReducedMotion() {
    return typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isSettled(viewport) {
    return viewport.centerSpringX.isAtTargetValue()
        && viewport.centerSpringY.isAtTargetValue()
        && viewport.zoomSpring.isAtTargetValue()
}

export function annotationBounds(viewer, annotationId) {
    const shapes = annotationShapes()
    const shape = shapes.find(item => item.getAttribute('data-id') === annotationId)

    if (!shape || typeof shape.getBBox !== "function") {
        return null
    }

    const box = shape.getBBox()

    if (!box.width || !box.height) {
        return null
    }

    return viewer.viewport.imageToViewportRectangle(box.x, box.y, box.width, box.height)
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
    const { defaultRotation = 0, transition = "turn" } = options
    const viewport = viewer.viewport

    cancelPendingTurn(viewer)

    viewer[LAST_VIEW] = { annotation, options }

    const bounds = annotationBounds(viewer, annotation.id)

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
