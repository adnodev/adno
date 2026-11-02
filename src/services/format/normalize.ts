import { ensureTargetGroups, targetGroupId } from "../../Utils/groups"
import type { Project } from "../../Utils/project"
import { getTargets, type Annotation, type Cutouts } from "../../Utils/targets"
import { bodyList, withContent, type Content } from "./body"
import { roundTargets } from "./geometry"
import { COMMENTING, CUTOUTS, HTML_FORMAT, type Body } from "./model"
import { splitRights } from "./rights"

const LEGACY_HTML_TYPE = 'HTMLBody'
const RICH_TEXT_TYPE = 'AdnoRichText'

export type Normalized = {
    project: Project,
    changed: boolean
}

type LegacyContent = Omit<Content, 'others'>

function isLegacyHtml(body: Body): boolean {
    return body.type === LEGACY_HTML_TYPE
}

function isLegacyText(body: Body): boolean {
    return body.type === 'TextualBody' &&
        body.purpose === COMMENTING &&
        body.format !== HTML_FORMAT
}

function isRichText(body: Body): boolean {
    return body.type === RICH_TEXT_TYPE
}

function isLegacyComment(body: Body): boolean {
    return isLegacyHtml(body) || isLegacyText(body) || isRichText(body)
}

function legacyContent(legacy: Body[]): LegacyContent {
    const text = legacy.find(isLegacyText)
    const htmls = legacy.filter(isLegacyHtml)
    const markdown = text ? text.value || '' : ''
    const latestHtml = htmls.length > 0 ? htmls[htmls.length - 1].value || '' : `<p>${markdown}</p>`

    return {
        markdown,
        html: latestHtml
    }
}

function normalizeBody(annotation: Annotation): Annotation {
    const bodies = bodyList(annotation)
    const legacy = bodies.filter(isLegacyComment)

    if (legacy.length === 0) {
        return annotation
    }

    const { html, markdown } = legacyContent(legacy)
    const others = bodies.filter(body => !isLegacyComment(body))

    return withContent(annotation, {
        markdown,
        html,
        others
    })
}

type LegacyCutouts = {
    adno?: {
        cutout?: boolean,
        cutouts?: Cutouts
    }
}

function allGroupsCutout(annotation: Annotation): Cutouts {
    return getTargets(annotation)
        .map(targetGroupId)
        .reduce<Cutouts>((flags, groupId) => ({ ...flags, [groupId]: true }), {})
}

function legacyCutouts(annotation: Annotation & LegacyCutouts): Cutouts | null {
    const adno = annotation.adno

    if (!adno) {
        return null
    }

    if (adno.cutout) {
        return allGroupsCutout(annotation)
    }

    return adno.cutouts || null
}

function renameCutouts(annotation: Annotation & LegacyCutouts): Annotation {
    const { adno, ...rest } = annotation
    const cutouts = legacyCutouts(annotation)

    if (!cutouts) {
        return annotation
    }

    return {
        ...rest,
        [CUTOUTS]: cutouts
    }
}

export function normalizeAnnotation(annotation: Annotation): Annotation {
    return renameCutouts(roundTargets(normalizeBody(annotation)))
}

export function normalizeProject(record: Project): Normalized {
    const project = {
        ...splitRights(record),
        annotations: ensureTargetGroups(record.annotations || [])
            .map(normalizeAnnotation)
    }

    return {
        project,
        changed: JSON.stringify(project) !== JSON.stringify(record)
    }
}
