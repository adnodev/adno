const IMAGE_API_SELECTOR = "ImageApiSelector"

export function normalizeAngle(degrees) {
    const angle = Number(degrees) % 360
    return angle < 0 ? angle + 360 : angle
}

export function shortestDelta(from, to) {
    const delta = (normalizeAngle(to) - normalizeAngle(from) + 540) % 360 - 180
    return delta === -180 ? 180 : delta
}

export function getAnnotationRotation(annotation) {
    const selector = annotation && annotation.target ? annotation.target.selector : null
    const refinedBy = selector ? selector.refinedBy : null

    if (!refinedBy || refinedBy.type !== IMAGE_API_SELECTOR) {
        return null
    }

    const rotation = parseFloat(refinedBy.rotation)

    return isNaN(rotation) ? null : normalizeAngle(rotation)
}

export function buildRotationSelector(degrees) {
    return {
        "type": IMAGE_API_SELECTOR,
        "rotation": String(normalizeAngle(degrees))
    }
}

export function withAnnotationRotation(annotation, degrees) {
    const selector = { ...annotation.target.selector }

    if (degrees === null || degrees === undefined || degrees === "") {
        delete selector.refinedBy
    } else {
        selector.refinedBy = buildRotationSelector(degrees)
    }

    return {
        ...annotation,
        target: {
            ...annotation.target,
            selector
        }
    }
}

export function preserveRotation(previousAnnotation, newTarget) {
    const rotation = getAnnotationRotation(previousAnnotation)

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
