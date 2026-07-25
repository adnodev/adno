import { annotationShapes } from "./utils"

const XYWH = /xywh=(?:pixel:)?([\d.]+),([\d.]+),([\d.]+),([\d.]+)/

export function getAnnotationCutout(annotation) {
    return Boolean(annotation && annotation.adno && annotation.adno.cutout)
}

export function withAnnotationCutout(annotation, enabled) {
    const adno = { ...annotation.adno }

    if (enabled) {
        adno.cutout = true
    } else {
        delete adno.cutout
    }

    const next = { ...annotation, adno }

    if (Object.keys(adno).length === 0) {
        delete next.adno
    }

    return next
}

export function preserveCutout(previousAnnotation, annotation) {
    return getAnnotationCutout(previousAnnotation) ? withAnnotationCutout(annotation, true) : annotation
}

export function annotationImageBox(annotation) {
    const shapes = annotationShapes()
    const shape = shapes.find(item => item.getAttribute('data-id') === annotation.id)

    if (shape && typeof shape.getBBox === "function") {
        const box = shape.getBBox()

        if (box.width && box.height) {
            return { x: box.x, y: box.y, width: box.width, height: box.height }
        }
    }

    const selector = annotation.target && annotation.target.selector
    const match = selector ? XYWH.exec(selector.value || '') : null

    if (!match) {
        return null
    }

    return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: parseFloat(match[3]),
        height: parseFloat(match[4])
    }
}
