import { getTargets, replaceTargetAt, shadowId, targetBox, toShadow, unionBoxes, withTargets, type Annotation, type AnnotationId, type Box, type ShadowAnnotation, type ShadowId, type Target, type TargetEntry, type TargetIndex } from "./targets"
import { annotationShapes } from "./utils"
import type { ProjectSettings } from "./project"
import { getTargetRotation, withTargetRotation } from "./orientation"

const GROUP_SEPARATOR = '@'
const GROUP_PATTERN = /^g(\d+)$/
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PALETTE = ['#2451C4', '#C4622A', '#1F9E6D', '#A23DBB']

const FIRST_GROUP = 'g1'

export type GroupId = string

export type GroupPalette = string[]

export type Group = {
    id: GroupId,
    letter: string,
    color: string,
    targets: TargetEntry[]
}

function parseTargetGroup(target: Target | undefined): GroupId | null {
    const id = target ? target.id : null

    if (typeof id !== 'string') {
        return null
    }

    const at = id.indexOf(GROUP_SEPARATOR)
    const prefix = at === -1 ? '' : id.slice(0, at)

    return GROUP_PATTERN.test(prefix) ? prefix : null
}

export function buildTargetId(groupId: GroupId, annotationId: AnnotationId): string {
    return `${groupId}${GROUP_SEPARATOR}${annotationId}`
}

export function targetGroupId(target: Target | undefined): GroupId {
    return parseTargetGroup(target) || FIRST_GROUP
}

export function ensureTargetGroups(annotations: Annotation[]): Annotation[] {
    return (annotations || []).map(annotation => withTargets(annotation,
        getTargets(annotation).map(target => target.id
            ? target
            : { ...target, id: buildTargetId(FIRST_GROUP, annotation.id) })))
}

export function nextGroupId(annotation: Annotation): GroupId {
    const numbers = getTargets(annotation)
        .map(target => GROUP_PATTERN.exec(targetGroupId(target)))
        .filter((match): match is RegExpExecArray => match !== null)
        .map(match => parseInt(match[1], 10))

    return `g${Math.max(0, ...numbers) + 1}`
}

export function preserveTargetId(previousTarget: Target | undefined, newTarget: Target | undefined): Target | undefined {
    const id = previousTarget ? previousTarget.id : null

    return id && newTarget ? { ...newTarget, id } : newTarget
}

export function groupLetter(rank: number): string {
    return LETTERS[rank % LETTERS.length]
}

export function groupColor(rank: number, palette: GroupPalette = PALETTE): string {
    return palette[rank % palette.length]
}

const GROUP_COLOR_KEYS = ['groupColorA', 'groupColorB', 'groupColorC', 'groupColorD'] as const

export function groupPalette(settings: Partial<ProjectSettings> | undefined): GroupPalette {
    return PALETTE.map((color, index) => (settings ? settings[GROUP_COLOR_KEYS[index]] : null) || color)
}

export function deriveGroups(annotation: Annotation | null, palette: GroupPalette = PALETTE): Group[] {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .reduce<Group[]>((groups, entry) => {
            const id = targetGroupId(entry.target)
            const found = groups.find(group => group.id === id)

            if (found) {
                return groups.map(group => group === found
                    ? { ...group, targets: [...group.targets, entry] }
                    : group)
            }

            return [...groups, {
                id,
                letter: groupLetter(groups.length),
                color: groupColor(groups.length, palette),
                targets: [entry]
            }]
        }, [])
}

function groupTargets(annotation: Annotation | null, groupId?: GroupId): Target[] {
    return getTargets(annotation).filter(target => !groupId || targetGroupId(target) === groupId)
}

export function groupBox(annotation: Annotation | null, groupId?: GroupId): Box | null {
    return unionBoxes(groupTargets(annotation, groupId)
        .map(targetBox)
        .filter((box): box is Box => box !== null))
}

export function groupRotation(annotation: Annotation | null, groupId?: GroupId): number | null {
    return getTargetRotation(groupTargets(annotation, groupId)[0])
}

export function withGroupRotation(annotation: Annotation, groupId: GroupId, degrees: number | null): Annotation {
    return withTargets(annotation, getTargets(annotation).map(target =>
        targetGroupId(target) === groupId ? withTargetRotation(target, degrees) : target))
}

export function moveTargetToGroup(annotation: Annotation, index: TargetIndex, groupId: GroupId): Annotation {
    const target = getTargets(annotation)[index]

    if (!target || targetGroupId(target) === groupId) {
        return annotation
    }

    return replaceTargetAt(annotation, index, { ...target, id: buildTargetId(groupId, annotation.id) })
}

export function movedTargetIndex(fromIndex: TargetIndex, toIndex: TargetIndex): TargetIndex {
    return toIndex > fromIndex ? toIndex - 1 : toIndex
}

export function moveTarget(annotation: Annotation, fromIndex: TargetIndex, toIndex: TargetIndex, groupId?: GroupId): Annotation {
    const targets = getTargets(annotation)
    const moving = targets[fromIndex]

    if (!moving) {
        return annotation
    }

    const stamped = groupId && targetGroupId(moving) !== groupId
        ? { ...moving, id: buildTargetId(groupId, annotation.id) }
        : moving

    const without = targets.filter((_, index) => index !== fromIndex)
    const at = movedTargetIndex(fromIndex, toIndex)

    return withTargets(annotation, [...without.slice(0, at), stamped, ...without.slice(at)])
}

export function targetIndexOf(annotation: Annotation, target: Target): TargetIndex {
    return Math.max(0, getTargets(annotation).findIndex(item => item === target))
}

function colorParts(shape: Element): SVGElement[] {
    const inner = shape.getElementsByClassName('a9s-inner')

    const parts = inner.length > 0
        ? [...inner]
        : [...shape.children].filter(child => child.tagName !== 'svg')

    return parts.filter((part): part is SVGElement => part instanceof SVGElement)
}

function paintShape(shape: Element, color: string | null): void {
    colorParts(shape).forEach(part => {
        if (color) {
            part.style.stroke = color
        } else {
            part.style.removeProperty('stroke')
        }
    })
}

function groupColorsById(annotation: Annotation, palette?: GroupPalette): Record<ShadowId, string> {
    return deriveGroups(annotation, palette).reduce<Record<ShadowId, string>>((colors, group) => group.targets.reduce(
        (acc, entry) => ({ ...acc, [shadowId(annotation.id, entry.index)]: group.color }), colors), {})
}

export function applyGroupColors(root: Element | undefined, annotation: Annotation | null, palette?: GroupPalette): void {
    const colors = annotation ? groupColorsById(annotation, palette) : {}

    annotationShapes(root).forEach(shape => paintShape(shape, colors[shape.getAttribute('data-id')]))
}

export function scheduleGroupColors(previous: number | undefined, element: Element, annotation: Annotation | null, palette?: GroupPalette): number {
    if (previous !== undefined) {
        cancelAnimationFrame(previous)
    }

    return requestAnimationFrame(() => applyGroupColors(element, annotation, palette))
}

export function applyAnnotationColor(root: Element, annotation: Annotation | null, color: string): void {
    const ids = annotation ? groupShadows(annotation).map(shadow => shadow.id) : []

    annotationShapes(root).forEach(shape => paintShape(shape, ids.includes(shape.getAttribute('data-id')) ? color : null))
}

export function groupShadows(annotation: Annotation, groupId?: GroupId): ShadowAnnotation[] {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .filter(entry => !groupId || targetGroupId(entry.target) === groupId)
        .map(entry => toShadow(annotation, entry.target, entry.index))
}

export function activeGroupId(annotation: Annotation, targetIndex: TargetIndex): GroupId {
    return targetGroupId(getTargets(annotation)[targetIndex])
}
