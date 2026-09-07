import { getTargets } from "./targets"

const IMAGE_API_SELECTOR = "ImageApiSelector"

export const QUARTER_TURNS = [0, 90, 180, 270]

export function normalizeAngle(degrees) {
    const angle = Number(degrees) % 360
    return angle < 0 ? angle + 360 : angle
}

export function shortestDelta(from, to) {
    const delta = (normalizeAngle(to) - normalizeAngle(from) + 540) % 360 - 180
    return delta === -180 ? 180 : delta
}

export function getTargetRotation(target) {
    const selector = target ? target.selector : null
    const refinedBy = selector ? selector.refinedBy : null

    if (!refinedBy || refinedBy.type !== IMAGE_API_SELECTOR) {
        return null
    }

    const rotation = parseFloat(refinedBy.rotation)

    return isNaN(rotation) ? null : normalizeAngle(rotation)
}

export function getAnnotationRotation(annotation) {
    return getTargetRotation(getTargets(annotation)[0])
}

function buildRotationSelector(degrees) {
    return {
        "type": IMAGE_API_SELECTOR,
        "rotation": String(normalizeAngle(degrees))
    }
}

export function withTargetRotation(target, degrees) {
    const { refinedBy, ...selector } = target.selector || {}
    const cleared = degrees === null || degrees === undefined || degrees === ""

    return {
        ...target,
        selector: cleared ? selector : { ...selector, refinedBy: buildRotationSelector(degrees) }
    }
}

export function preserveTargetRotation(previousTarget, newTarget) {
    const rotation = getTargetRotation(previousTarget)

    if (rotation === null || !newTarget || !newTarget.selector) {
        return newTarget
    }

    return {
        ...newTarget,
        selector: {
            ...newTarget.selector,
            refinedBy: buildRotationSelector(rotation)
        }
    }
}

export function resolveRotation(annotation, defaultRotation) {
    const rotation = getAnnotationRotation(annotation)

    return rotation === null ? normalizeAngle(defaultRotation || 0) : rotation
}
