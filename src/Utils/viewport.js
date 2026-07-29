import { normalizeAngle, resolveRotation, shortestDelta } from "./orientation"
import { getAnnotationCutout } from "./cutout"
import { annotationShapes } from "./utils"
import { parseShadowId } from "./targets"

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
    const wanted = parseShadowId(annotationId).id

    const boxes = annotationShapes()
        .filter(item => parseShadowId(item.getAttribute('data-id')).id === wanted)
        .filter(item => typeof item.getBBox === "function")
        .map(item => item.getBBox())
        .filter(box => box.width && box.height)

    if (boxes.length === 0) {
        return null
    }

    const left = Math.min(...boxes.map(box => box.x))
    const top = Math.min(...boxes.map(box => box.y))
    const right = Math.max(...boxes.map(box => box.x + box.width))
    const bottom = Math.max(...boxes.map(box => box.y + box.height))

    return viewer.viewport.imageToViewportRectangle(left, top, right - left, bottom - top)
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
