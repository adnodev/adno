import { getTargets, type Annotation, type Target } from "../../Utils/targets"
import { bodyList } from "./body"
import { annotationId } from "./ids"
import type { JsonObject } from "./model"

export type ExportZone = (target: Target, index: number) => JsonObject | Target

export function singleOrArray<T>(items: T[]): T | T[] {
    return items.length === 1 ? items[0] : items
}

export function exportAnnotation(annotation: Annotation, root: string, exportZone: ExportZone): JsonObject {
    const { '@context': context, id, type, body, target, ...rest } = annotation

    return {
        id: annotationId(root, annotation.id),
        type: 'Annotation',
        motivation: 'commenting',
        body: singleOrArray(bodyList(annotation)),
        ...rest,
        target: singleOrArray(getTargets(annotation).map(exportZone))
    }
}
