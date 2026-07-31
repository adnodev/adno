import { imageIndexForSource } from "./images"

const SHADOW_SEPARATOR = '#t:'
const XYWH = /xywh=(?:pixel:)?([\d.]+),([\d.]+),([\d.]+),([\d.]+)/
const CIRCLE = /<circle[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"[^>]*r="([-\d.]+)"/
const ELLIPSE = /<ellipse[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"[^>]*rx="([-\d.]+)"[^>]*ry="([-\d.]+)"/
const POINTS = /points="([^"]+)"/
const PATH = /\sd="([^"]+)"/

function boxAround(x, y, radiusX, radiusY) {
    return { x: x - radiusX, y: y - radiusY, width: radiusX * 2, height: radiusY * 2 }
}

function boxOfPoints(points) {
    const numbers = points.replace(/[A-Za-z]/g, ' ').trim().split(/[\s,]+/).map(parseFloat).filter(value => !isNaN(value))
    const xs = numbers.filter((_, index) => index % 2 === 0)
    const ys = numbers.filter((_, index) => index % 2 === 1)

    if (xs.length === 0 || ys.length === 0) {
        return null
    }

    const left = Math.min(...xs)
    const top = Math.min(...ys)

    return { x: left, y: top, width: Math.max(...xs) - left, height: Math.max(...ys) - top }
}

export function targetBox(target) {
    const selector = target ? target.selector : null
    const value = selector ? selector.value || '' : ''

    const fragment = XYWH.exec(value)

    if (fragment) {
        return {
            x: parseFloat(fragment[1]),
            y: parseFloat(fragment[2]),
            width: parseFloat(fragment[3]),
            height: parseFloat(fragment[4])
        }
    }

    const circle = CIRCLE.exec(value)

    if (circle) {
        return boxAround(parseFloat(circle[1]), parseFloat(circle[2]), parseFloat(circle[3]), parseFloat(circle[3]))
    }

    const ellipse = ELLIPSE.exec(value)

    if (ellipse) {
        return boxAround(parseFloat(ellipse[1]), parseFloat(ellipse[2]), parseFloat(ellipse[3]), parseFloat(ellipse[4]))
    }

    const points = POINTS.exec(value) || PATH.exec(value)

    return points ? boxOfPoints(points[1]) : null
}

export function getTargets(annotation) {
    const target = annotation ? annotation.target : null

    if (!target) {
        return []
    }

    return Array.isArray(target) ? target : [target]
}

export function primaryTarget(annotation) {
    return getTargets(annotation)[0] || null
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

export function toAllShadows(annotations) {
    return (annotations || []).flatMap(annotation =>
        getTargets(annotation).map((target, index) => toShadow(annotation, target, index)))
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
