import { getAnnotationRotation, normalizeAngle } from "./orientation"

const ANNOTATION_CLASS = "a9s-annotation"
const IIIF_MAX_SIZE = 1600
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
    const shapes = [...document.getElementsByClassName(ANNOTATION_CLASS)]
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

export function rotatedSize(box, degrees) {
    const radians = normalizeAngle(degrees) * Math.PI / 180
    const cos = Math.abs(Math.cos(radians))
    const sin = Math.abs(Math.sin(radians))

    return {
        width: box.width * cos + box.height * sin,
        height: box.width * sin + box.height * cos
    }
}

export function buildIIIFCutoutUrl(manifestUrl, box, degrees) {
    if (!manifestUrl || !manifestUrl.includes('/info.json')) {
        return null
    }

    const base = manifestUrl.replace('/info.json', '')
    const region = [box.x, box.y, box.width, box.height].map(Math.round).join(',')

    return `${base}/${region}/!${IIIF_MAX_SIZE},${IIIF_MAX_SIZE}/${normalizeAngle(degrees)}/default.jpg`
}

export function buildCssCutout(box, degrees, maxSize) {
    const size = rotatedSize(box, degrees)
    const scale = Math.min(1, maxSize / size.width, maxSize / size.height)
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    return {
        frame: {
            width: `${size.width * scale}px`,
            height: `${size.height * scale}px`,
            overflow: 'hidden',
            position: 'relative'
        },
        image: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            maxWidth: 'none',
            transformOrigin: '0 0',
            transform: `scale(${scale}) rotate(${normalizeAngle(degrees)}deg) translate(${-centerX}px, ${-centerY}px)`
        }
    }
}

export function resolveCutout(project, annotation, maxSize) {
    const box = annotationImageBox(annotation)

    if (!box) {
        return null
    }

    const degrees = getAnnotationRotation(annotation) || 0
    const iiif = buildIIIFCutoutUrl(project.manifest_url, box, degrees)

    if (iiif) {
        return { src: iiif, styles: null }
    }

    return { src: project.img_url, styles: buildCssCutout(box, degrees, maxSize) }
}
