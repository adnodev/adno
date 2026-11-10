export const COMMENTING = 'commenting'

export const HTML_FORMAT = 'text/html'

export const SOURCE_MARKDOWN = 'adno:sourceMarkdown'

export const CUTOUTS = 'adno:cutouts'

export const ADNO_PROJECT = 'adno:project'

export type JsonObject = Record<string, unknown>

export type Manifest = JsonObject

export type LanguageMap = Record<string, string[]>

export type ExportOptions = {
    base: string
}

export type ImportOptions = {
    id: string
}

export type Body = {
    type?: string,
    value?: string,
    format?: string,
    purpose?: string,
    [key: string]: unknown
}
