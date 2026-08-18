import { getTargets, replaceTargetAt, shadowId, targetBox, toShadow, withTargets } from "./targets"
import { annotationShapes } from "./utils"
import { getTargetRotation, withTargetRotation } from "./orientation"

const GROUP_SEPARATOR = '@'
const GROUP_PATTERN = /^g(\d+)$/
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PALETTE = ['#2451C4', '#C4622A', '#1F9E6D', '#A23DBB']

const FIRST_GROUP = 'g1'

function parseTargetGroup(target) {
    const id = target ? target.id : null
    const at = typeof id === 'string' ? id.indexOf(GROUP_SEPARATOR) : -1
    const prefix = at === -1 ? '' : id.slice(0, at)

    return GROUP_PATTERN.test(prefix) ? prefix : null
}

export function buildTargetId(groupId, annotationId) {
    return `${groupId}${GROUP_SEPARATOR}${annotationId}`
}

export function targetGroupId(target) {
    return parseTargetGroup(target) || FIRST_GROUP
}

export function ensureTargetGroups(annotations) {
    return (annotations || []).map(annotation => withTargets(annotation,
        getTargets(annotation).map(target => target.id
            ? target
            : { ...target, id: buildTargetId(FIRST_GROUP, annotation.id) })))
}

export function nextGroupId(annotation) {
    const numbers = getTargets(annotation)
        .map(target => GROUP_PATTERN.exec(targetGroupId(target)))
        .filter(Boolean)
        .map(match => parseInt(match[1], 10))

    return `g${Math.max(0, ...numbers) + 1}`
}

export function preserveTargetId(previousTarget, newTarget) {
    const id = previousTarget ? previousTarget.id : null

    return id && newTarget ? { ...newTarget, id } : newTarget
}

export function groupLetter(rank) {
    return LETTERS[rank % LETTERS.length]
}

export function groupColor(rank) {
    return PALETTE[rank % PALETTE.length]
}

export function deriveGroups(annotation) {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .reduce((groups, entry) => {
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
                color: groupColor(groups.length),
                targets: [entry]
            }]
        }, [])
}

function groupTargets(annotation, groupId) {
    return getTargets(annotation).filter(target => !groupId || targetGroupId(target) === groupId)
}

export function groupBox(annotation, groupId) {
    const boxes = groupTargets(annotation, groupId).map(targetBox).filter(Boolean)

    if (boxes.length === 0) {
        return null
    }

    const left = Math.min(...boxes.map(box => box.x))
    const top = Math.min(...boxes.map(box => box.y))
    const right = Math.max(...boxes.map(box => box.x + box.width))
    const bottom = Math.max(...boxes.map(box => box.y + box.height))

    return { x: left, y: top, width: right - left, height: bottom - top }
}

export function groupRotation(annotation, groupId) {
    return getTargetRotation(groupTargets(annotation, groupId)[0])
}

export function withGroupRotation(annotation, groupId, degrees) {
    return withTargets(annotation, getTargets(annotation).map(target =>
        targetGroupId(target) === groupId ? withTargetRotation(target, degrees) : target))
}

export function moveTargetToGroup(annotation, index, groupId) {
    const target = getTargets(annotation)[index]

    if (!target || targetGroupId(target) === groupId) {
        return annotation
    }

    return replaceTargetAt(annotation, index, { ...target, id: buildTargetId(groupId, annotation.id) })
}

export function movedTargetIndex(fromIndex, toIndex) {
    return toIndex > fromIndex ? toIndex - 1 : toIndex
}

export function moveTarget(annotation, fromIndex, toIndex, groupId) {
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

export function targetIndexOf(annotation, target) {
    return Math.max(0, getTargets(annotation).findIndex(item => item === target))
}

export function withGroupOrder(annotation, order) {
    const groups = deriveGroups(annotation)
    const ranked = order.map(id => groups.find(group => group.id === id)).filter(Boolean)
    const rest = groups.filter(group => !order.includes(group.id))

    return withTargets(annotation, [...ranked, ...rest]
        .flatMap(group => group.targets.map(entry => entry.target)))
}

function colorParts(shape) {
    const inner = shape.getElementsByClassName('a9s-inner')

    return inner.length > 0
        ? [...inner]
        : [...shape.children].filter(child => child.tagName !== 'svg')
}

function paintShape(shape, color) {
    colorParts(shape).forEach(part => {
        if (color) {
            part.style.stroke = color
        } else {
            part.style.removeProperty('stroke')
        }
    })
}

function groupColorsById(annotation) {
    return deriveGroups(annotation).reduce((colors, group) => group.targets.reduce(
        (acc, entry) => ({ ...acc, [shadowId(annotation.id, entry.index)]: group.color }), colors), {})
}

export function applyGroupColors(root, annotation) {
    const colors = annotation ? groupColorsById(annotation) : {}

    annotationShapes(root).forEach(shape => paintShape(shape, colors[shape.getAttribute('data-id')]))
}

export function groupShadows(annotation, groupId) {
    return getTargets(annotation)
        .map((target, index) => ({ target, index }))
        .filter(entry => !groupId || targetGroupId(entry.target) === groupId)
        .map(entry => toShadow(annotation, entry.target, entry.index))
}

export function activeGroupId(annotation, targetIndex) {
    return targetGroupId(getTargets(annotation)[targetIndex])
}
