export const ADNO_CONTEXT_URL = 'https://w.adno.app/ns/context.json'

export const IIIF_CONTEXT_URL = 'http://iiif.io/api/presentation/3/context.json'

export const ANNO_CONTEXT_URL = 'http://www.w3.org/ns/anno.jsonld'

export function iiifContext(): string[] {
    return [ADNO_CONTEXT_URL, IIIF_CONTEXT_URL]
}

export function wadmContext(): string[] {
    return [ADNO_CONTEXT_URL, ANNO_CONTEXT_URL]
}
