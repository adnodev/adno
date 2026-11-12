import { buildTargetId, groupIdFromLetter, type GroupId } from "../../Utils/groups"
import { withTargets, type Annotation, type Target } from "../../Utils/targets"
import { ANNO_CONTEXT_URL } from "./context"
import { isTargetLike, targetFromReference } from "./iiif"
import { asList, COMMENTING, isAnnotationBody, SOURCE_MARKDOWN, type AnnotationBody, type JsonObject } from "./model"

function slug(iri: string): string {
    return iri.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function internalAnnotationId(id: unknown, index: number, taken: Set<string>): string {
    if (typeof id !== 'string' || !id) {
        return `#annotation-${index + 1}`
    }

    if (!id.includes('/')) {
        return id
    }

    const short = `#${id.split('/').pop()}`

    return taken.has(short) ? `#${slug(id)}` : short
}

const EXPORTED_ZONE = /#(g\d+)-\d+$/
const INTERNAL_ZONE = /^g\d+@/

function zoneGroupId(zone: Target & { group?: unknown }): GroupId | null {
    const id = typeof zone.id === 'string' ? zone.id : ''
    const exported = EXPORTED_ZONE.exec(id)

    if (typeof zone.group === 'string') {
        return groupIdFromLetter(zone.group)
    }

    if (exported) {
        return exported[1]
    }

    return INTERNAL_ZONE.test(id) ? id.split('@')[0] : null
}

function convertTargetToInternalModel(zone: Target, internalId: string): Target {
    const groupId = zoneGroupId(zone)

    return {
        ...(groupId ? { id: buildTargetId(groupId, internalId) } : {}),
        ...(zone.source ? { source: zone.source } : {}),
        ...(zone.selector ? { selector: zone.selector } : {})
    }
}

function withCommentingPurpose(body: AnnotationBody): AnnotationBody {
    if (typeof body === 'string' || body.type !== 'TextualBody' || body.purpose) {
        return body
    }

    return {
        ...body,
        purpose: COMMENTING
    }
}

function readForeignBodies(foreign: JsonObject): AnnotationBody[] {
    return asList(foreign.body).filter(isAnnotationBody)
}

function readForeignTarget(target: Target | string): Target {
    return typeof target === 'string' ? targetFromReference(target) : target
}

export function readForeignTargets(foreign: JsonObject): Target[] {
    return asList(foreign.target).filter(isTargetLike).map(readForeignTarget)
}

function convertToInternalModel(foreign: JsonObject, internalId: string): Annotation {
    const { '@context': context, id, type, motivation, body, target, sourceText, sourceMarkdown, ...rest } = foreign

    const markdown = typeof sourceMarkdown === 'string'
        ? { [SOURCE_MARKDOWN]: sourceMarkdown }
        : {}

    const converted: Annotation = {
        '@context': ANNO_CONTEXT_URL,
        id: internalId,
        type: 'Annotation',
        body: readForeignBodies(foreign).map(withCommentingPurpose),
        ...rest,
        ...markdown
    }

    return withTargets(converted, readForeignTargets(foreign).map(zone => convertTargetToInternalModel(zone, internalId)))
}

export function convertAllToInternalModel(foreign: JsonObject[]): Annotation[] {
    const taken = new Set<string>()

    return foreign.map((annotation, index) => {
        const internalId = internalAnnotationId(annotation.id, index, taken)

        taken.add(internalId)

        return convertToInternalModel(annotation, internalId)
    })
}
