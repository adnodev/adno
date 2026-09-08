import { imageIndexForSource, type ImageIndex, type ProjectImage } from "./images"
import type { GroupId } from "./groups"

const SHADOW_SEPARATOR = '#t:'
const XYWH = /xywh=(?:pixel:)?([\d.]+),([\d.]+),([\d.]+),([\d.]+)/
const CIRCLE = /<circle[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"[^>]*r="([-\d.]+)"/
const ELLIPSE = /<ellipse[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"[^>]*rx="([-\d.]+)"[^>]*ry="([-\d.]+)"/
const POINTS = /points="([^"]+)"/
const PATH = /\sd="([^"]+)"/

export type AnnotationId = string

export type ShadowId = string

export type TargetIndex = number

export type Box = {
    x: number,
    y: number,
    width: number,
    height: number
}

export type Rect = Box & { kind: 'rect' }

export type Circle = {
    kind: 'circle',
    cx: number,
    cy: number,
    r: number
}

export type Ellipse = {
    kind: 'ellipse',
    cx: number,
    cy: number,
    rx: number,
    ry: number
}

export type Polygon = {
    kind: 'polygon',
    points: string
}

export type Path = {
    kind: 'path',
    d: string
}

export type Shape = Rect | Circle | Ellipse | Polygon | Path

export type Selector = {
    type?: string,
    value?: string,
    refinedBy?: { type?: string, rotation?: string }
}

export type Target = {
    id?: string,
    source?: string,
    selector?: Selector
}

export type Cutouts = Record<GroupId, boolean>

export type AnnotationAdno = {
    cutouts?: Cutouts
}

export type Annotation = {
    id: AnnotationId,
    target?: Target | Target[],
    adno?: AnnotationAdno,
    [key: string]: unknown
}

export type TargetEntry = {
    target: Target,
    index: TargetIndex
}

export type ShadowAnnotation = Annotation & { target: Target }

function boxAround(x: number, y: number, radiusX: number, radiusY: number): Box {
    return { x: x - radiusX, y: y - radiusY, width: radiusX * 2, height: radiusY * 2 }
}

function boxOfPoints(points: string): Box | null {
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

export function unionBoxes(boxes: Box[]) {
    if (boxes.length === 0) {
        return null
    }

    const left = Math.min(...boxes.map(box => box.x))
    const top = Math.min(...boxes.map(box => box.y))
    const right = Math.max(...boxes.map(box => box.x + box.width))
    const bottom = Math.max(...boxes.map(box => box.y + box.height))

    return { x: left, y: top, width: right - left, height: bottom - top }
}

export function targetShape(target: Target | null): Shape | null {
    const selector = target ? target.selector : null
    const value = selector ? selector.value || '' : ''

    const fragment = XYWH.exec(value)

    if (fragment) {
        return {
            kind: 'rect',
            x: parseFloat(fragment[1]),
            y: parseFloat(fragment[2]),
            width: parseFloat(fragment[3]),
            height: parseFloat(fragment[4])
        }
    }

    const circle = CIRCLE.exec(value)

    if (circle) {
        return { kind: 'circle', cx: parseFloat(circle[1]), cy: parseFloat(circle[2]), r: parseFloat(circle[3]) }
    }

    const ellipse = ELLIPSE.exec(value)

    if (ellipse) {
        return {
            kind: 'ellipse',
            cx: parseFloat(ellipse[1]),
            cy: parseFloat(ellipse[2]),
            rx: parseFloat(ellipse[3]),
            ry: parseFloat(ellipse[4])
        }
    }

    const points = POINTS.exec(value)

    if (points) {
        return { kind: 'polygon', points: points[1] }
    }

    const path = PATH.exec(value)

    return path ? { kind: 'path', d: path[1] } : null
}

export function targetBox(target: Target | null): Box | null {
    const shape = targetShape(target)

    if (!shape) {
        return null
    }

    if (shape.kind === 'rect') {
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
    }

    if (shape.kind === 'circle') {
        return boxAround(shape.cx, shape.cy, shape.r, shape.r)
    }

    if (shape.kind === 'ellipse') {
        return boxAround(shape.cx, shape.cy, shape.rx, shape.ry)
    }

    return boxOfPoints(shape.kind === 'polygon' ? shape.points : shape.d)
}

export function getTargets(annotation: Annotation | null): Target[] {
    const target = annotation ? annotation.target : null

    if (!target) {
        return []
    }

    return Array.isArray(target) ? target : [target]
}

export function withTargets(annotation: Annotation, targets: Target[]): Annotation {
    if (!targets || targets.length === 0) {
        const { target, ...rest } = annotation
        return rest
    }

    return {
        ...annotation,
        target: targets.length === 1 ? targets[0] : [...targets]
    }
}

export function addTarget(annotation: Annotation, target: Target): Annotation {
    return withTargets(annotation, [...getTargets(annotation), target])
}

export function removeTargetAt(annotation: Annotation, index: TargetIndex): Annotation {
    return withTargets(annotation, getTargets(annotation).filter((_, i) => i !== index))
}

export function replaceTargetAt(annotation: Annotation, index: TargetIndex, target: Target): Annotation {
    return withTargets(annotation, getTargets(annotation).map((current, i) => i === index ? target : current))
}

export function shadowId(id: AnnotationId, index: TargetIndex): ShadowId {
    return index > 0 ? `${id}${SHADOW_SEPARATOR}${index}` : id
}

export function parseShadowId(shadowedId: ShadowId | null): { id: AnnotationId | null, index: TargetIndex } {
    if (typeof shadowedId !== 'string') {
        return { id: shadowedId, index: 0 }
    }

    const at = shadowedId.lastIndexOf(SHADOW_SEPARATOR)
    const suffix = at === -1 ? '' : shadowedId.slice(at + SHADOW_SEPARATOR.length)

    if (!/^\d+$/.test(suffix)) {
        return { id: shadowedId, index: 0 }
    }

    return { id: shadowedId.slice(0, at), index: parseInt(suffix, 10) }
}

function targetsOnImage(annotation: Annotation, images: ProjectImage[], imageIndex: ImageIndex): TargetEntry[] {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .filter(({ target }) => imageIndexForSource(images, target && target.source) === imageIndex)
}

export function pickTargetOnImage(annotation: Annotation, images: ProjectImage[], imageIndex: ImageIndex, targetIndex: TargetIndex): TargetEntry | null {
    const onImage = targetsOnImage(annotation, images, imageIndex)

    return onImage.find(item => item.index === targetIndex) || onImage[0] || null
}

export function toShadow(annotation: Annotation, target: Target, index: TargetIndex): ShadowAnnotation {
    return {
        ...annotation,
        id: shadowId(annotation.id, index),
        target
    }
}

function targetArea(target: Target): number {
    const box = targetBox(target)

    return box ? box.width * box.height : 0
}

export function toShadowAnnotations(annotations: Annotation[], images: ProjectImage[], imageIndex: ImageIndex): ShadowAnnotation[] {
    return (annotations || []).flatMap(annotation =>
        targetsOnImage(annotation, images, imageIndex)
            .map(({ target, index }) => toShadow(annotation, target, index)))
        .sort((a, b) => targetArea(b.target) - targetArea(a.target))
}

export function zoneCountsByImage(annotations: Annotation[], images: ProjectImage[]): number[] {
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
