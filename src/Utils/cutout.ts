import { CUTOUTS } from "../services/format/model"
import type { GroupId } from "./groups"
import type { Annotation, Cutouts } from "./targets"

function cutouts(annotation: Annotation | null): Cutouts {
    if (!annotation) {
        return {}
    }

    return annotation[CUTOUTS] || {}
}

export function getGroupCutout(annotation: Annotation | null, groupId: GroupId): boolean {
    return Boolean(cutouts(annotation)[groupId])
}

export function cutoutGroupIds(annotation: Annotation | null): GroupId[] {
    const flags = cutouts(annotation)

    return Object.keys(flags).filter(id => flags[id])
}

export function withGroupCutout(annotation: Annotation, groupId: GroupId, enabled: boolean): Annotation {
    const { [CUTOUTS]: current, ...rest } = annotation

    const kept = Object.entries({ ...cutouts(annotation), [groupId]: enabled })
        .filter(([, on]) => on)
        .reduce<Cutouts>((flags, [id]) => ({ ...flags, [id]: true }), {})

    return Object.keys(kept).length > 0 ? { ...rest, [CUTOUTS]: kept } : rest
}
