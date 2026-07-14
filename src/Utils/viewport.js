import { resolveRotation, shortestDelta } from "./orientation"

const ANNOTATION_CLASS = "a9s-annotation"
const PENDING_TURN = "adnoPendingTurn"
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
    const shapes = [...document.getElementsByClassName(ANNOTATION_CLASS)]
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

    const bounds = annotationBounds(viewer, annotation.id)

    if (!bounds) {
        annotorious.fitBounds(annotation.id)
        return
    }

    const current = viewport.getRotation()
    const delta = shortestDelta(current, resolveRotation(annotation, defaultRotation))

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
