import { ADNO_PROJECT, type JsonObject } from "./model"

const BASE64_SETTINGS_LABEL = 'adno_settings'

export type Format =
    | 'adno-manifest'
    | 'legacy-base64-manifest'
    | 'iiif-manifest'
    | 'adno-collection'
    | 'legacy-collection'
    | 'annotation-collection'
    | 'iiif-v2'
    | 'image-info'
    | 'unknown'

// "http://iiif.io/api/presentation/3/context.json"      -> '"http://iiif.io/api/presentation/3/context.json"'
// ["http://www.w3.org/ns/anno.jsonld", { "adno": "…" }] -> '["http://www.w3.org/ns/anno.jsonld",{"adno":"…"}]'
// no context                                            -> '""'
function contextText(json: JsonObject): string {
    const context = json['@context'] || json.context

    return JSON.stringify(context || '')
}

// [{ label: { en: ["title"] } }, { label: { en: ["adno_settings"] } }] -> '[{"en":["title"]},{"en":["adno_settings"]}]'
// no metadata                                                          -> ''
function metadataLabels(json: JsonObject): string {
    const metadata = json.metadata

    if (!Array.isArray(metadata)) {
        return ''
    }

    return JSON.stringify(metadata.map(entry => entry.label))
}

// { "@context": "http://iiif.io/api/image/3/context.json", "type": "ImageService3" }  -> true
// { "@context": "http://iiif.io/api/image/2/context.json", "@type": "iiif:Image" }    -> true
// { "type": "Manifest", ... }                                                         -> false
function isImageInfo(json: JsonObject, context: string): boolean {
    return context.includes('iiif.io/api/image/')
        || json.type === 'ImageService2'
        || json.type === 'ImageService3'
        || json['@type'] === 'iiif:Image'
}

export function isAdnoExport(json: JsonObject): boolean {
    const format = detectFormat(json)

    return format.startsWith('adno-') || format.startsWith('legacy-')
}

// Manifest + adno:project                     -> 'adno-manifest'
// Manifest + metadata label "adno_settings"   -> 'legacy-base64-manifest'
// Manifest                                    -> 'iiif-manifest'
// AnnotationCollection + adno:project         -> 'adno-collection'
// AnnotationCollection + format "Adno"        -> 'legacy-collection'
// AnnotationCollection                        -> 'annotation-collection'
// sc:Manifest or presentation/2 context       -> 'iiif-v2'
// info.json                                   -> 'image-info'
export function detectFormat(json: JsonObject): Format {
    const context = contextText(json)
    const labels = metadataLabels(json)

    if (json.type === 'Manifest') {
        if (json[ADNO_PROJECT]) {
            return 'adno-manifest'
        }

        if (labels.includes(BASE64_SETTINGS_LABEL))
            return 'legacy-base64-manifest'
        else
            return 'iiif-manifest'
    }

    if (json.type === 'AnnotationCollection') {
        if (json[ADNO_PROJECT]) {
            return 'adno-collection'
        }

        if (json.format === 'Adno' || json.adno_settings)
            return 'legacy-collection'
        else
            return 'annotation-collection'
    }

    if (json['@type'] === 'sc:Manifest' || context.includes('iiif.io/api/presentation/2')) {
        return 'iiif-v2'
    }

    if (isImageInfo(json, context))
        return 'image-info'
    else
        return 'unknown'
}
