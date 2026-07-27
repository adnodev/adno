import { imageIndexForSource } from "./images"

const SHADOW_SEPARATOR = '#t:'

export function getTargets(annotation) {
    const target = annotation ? annotation.target : null

    if (!target) {
        return []
    }

    return Array.isArray(target) ? target : [target]
}

export function withTargets(annotation, targets) {
    if (!targets || targets.length === 0) {
        const { target, ...rest } = annotation
        return rest
    }

    return {
        ...annotation,
        target: targets.length === 1 ? targets[0] : [...targets]
    }
}

export function addTarget(annotation, target) {
    return withTargets(annotation, [...getTargets(annotation), target])
}

export function removeTargetAt(annotation, index) {
    return withTargets(annotation, getTargets(annotation).filter((_, i) => i !== index))
}

export function replaceTargetAt(annotation, index, target) {
    return withTargets(annotation, getTargets(annotation).map((current, i) => i === index ? target : current))
}

export function shadowId(id, index) {
    return index > 0 ? `${id}${SHADOW_SEPARATOR}${index}` : id
}

export function parseShadowId(shadowedId) {
    const at = typeof shadowedId === 'string' ? shadowedId.lastIndexOf(SHADOW_SEPARATOR) : -1
    const suffix = at === -1 ? '' : shadowedId.slice(at + SHADOW_SEPARATOR.length)

    if (!/^\d+$/.test(suffix)) {
        return { id: shadowedId, index: 0 }
    }

    return { id: shadowedId.slice(0, at), index: parseInt(suffix, 10) }
}

export function targetsOnImage(annotation, images, imageIndex) {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .filter(({ target }) => imageIndexForSource(images, target && target.source) === imageIndex)
}

export function toShadow(annotation, target, index) {
    return {
        ...annotation,
        id: shadowId(annotation.id, index),
        target
    }
}

export function toShadowAnnotations(annotations, images, imageIndex) {
    return (annotations || []).flatMap(annotation =>
        targetsOnImage(annotation, images, imageIndex)
            .map(({ target, index }) => toShadow(annotation, target, index)))
}

export function zoneCountsByImage(annotations, images) {
    const counts = (images || []).map(() => 0)

    for (const annotation of annotations || []) {
        for (const target of getTargets(annotation)) {
            const index = imageIndexForSource(images, target && target.source)

            if (counts[index] !== undefined) {
                counts[index] += 1
            }
        }
    }

    return counts
}
