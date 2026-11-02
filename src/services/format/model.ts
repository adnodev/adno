export const COMMENTING = 'commenting'

export const HTML_FORMAT = 'text/html'

export const SOURCE_MARKDOWN = 'adno:sourceMarkdown'

export const CUTOUTS = 'adno:cutouts'

export type Body = {
    type?: string,
    value?: string,
    format?: string,
    purpose?: string,
    [key: string]: unknown
}
