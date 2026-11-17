import TurndownService from "turndown"
import type { Annotation } from "../../Utils/targets"
import { asList, COMMENTING, HTML_FORMAT, isAnnotationBody, SOURCE_MARKDOWN, type AnnotationBody, type Body } from "./model"

export function bodyList(annotation: Annotation | null): AnnotationBody[] {
    const body = annotation ? annotation.body : undefined

    if (!body) {
        return []
    }

    return asList(body).filter(isAnnotationBody)
}

function isHtmlComment(body: AnnotationBody): body is Body {
    return typeof body !== 'string' &&
        body.type === 'TextualBody' &&
        body.purpose === COMMENTING &&
        body.format === HTML_FORMAT
}

export function annotationHtml(annotation: Annotation | null): string | null {
    const html = bodyList(annotation).find(isHtmlComment)

    return html && html.value ? html.value : null
}

export function htmlBody(value: string): Body {
    return {
        type: 'TextualBody',
        value,
        format: HTML_FORMAT,
        purpose: COMMENTING
    }
}

export type Content = {
    markdown: string,
    html: string,
    others: AnnotationBody[]
}

export function withContent(annotation: Annotation, content: Content): Annotation {
    const { markdown, html, others } = content

    return {
        ...annotation,
        body: html ? [htmlBody(html), ...others] : others,
        [SOURCE_MARKDOWN]: markdown
    }
}

export function annotationMarkdown(annotation: Annotation | null): string {
    const source = annotation ? annotation[SOURCE_MARKDOWN] : null

    if (typeof source === 'string') {
        return source
    }

    const html = annotationHtml(annotation)

    return html ? new TurndownService().turndown(html) : ''
}
