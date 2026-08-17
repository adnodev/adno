import { deriveGroups } from "./groups"

export function getAnnotationCutout(annotation) {
    const adno = annotation ? annotation.adno : null

    if (!adno) {
        return false
    }

    return Boolean(adno.cutout) || Object.values(adno.cutouts || {}).some(Boolean)
}

export function getGroupCutout(annotation, groupId) {
    const adno = annotation ? annotation.adno : null

    if (!adno) {
        return false
    }

    return Boolean(adno.cutouts ? adno.cutouts[groupId] : adno.cutout)
}

export function withGroupCutout(annotation, groupId, enabled) {
    const { adno, ...rest } = annotation
    const { cutout, cutouts, ...others } = adno || {}

    const legacy = cutout
        ? deriveGroups(annotation).reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
        : {}

    const merged = { ...legacy, ...cutouts, [groupId]: enabled }
    const kept = Object.keys(merged)
        .filter(key => merged[key])
        .reduce((acc, key) => ({ ...acc, [key]: true }), {})

    const next = Object.keys(kept).length > 0 ? { ...others, cutouts: kept } : others

    return Object.keys(next).length > 0 ? { ...rest, adno: next } : rest
}

export function cutoutGroupIds(annotation) {
    const cutouts = annotation && annotation.adno ? annotation.adno.cutouts : null

    return cutouts ? Object.keys(cutouts).filter(key => cutouts[key]) : []
}
