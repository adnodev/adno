import { buildTargetId, groupIdFromLetter, type GroupId } from "../../Utils/groups"
import { getTargets, withTargets, type Annotation, type Target } from "../../Utils/targets"
import { bodyList } from "./body"
import { ANNO_CONTEXT_URL } from "./context"
import { COMMENTING, SOURCE_MARKDOWN, type Body, type JsonObject } from "./model"

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

function withCommentingPurpose(body: Body): Body {
    if (body.type !== 'TextualBody' || body.purpose) {
        return body
    }

    return {
        ...body,
        purpose: COMMENTING
    }
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
        body: bodyList(foreign as Annotation).map(withCommentingPurpose),
        ...rest,
        ...markdown
    }

    return withTargets(converted, getTargets(foreign as Annotation).map(zone => convertTargetToInternalModel(zone, internalId)))
}

export function convertAllToInternalModel(foreign: JsonObject[]): Annotation[] {
    const taken = new Set<string>()

    return foreign.map((annotation, index) => {
        const internalId = internalAnnotationId(annotation.id, index, taken)

        taken.add(internalId)

        return convertToInternalModel(annotation, internalId)
    })
}
