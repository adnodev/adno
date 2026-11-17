import { ADNO_PROJECT, objectList, type JsonObject } from "./model"

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

function contextText(json: JsonObject): string {
    const context = json['@context'] || json.context

    return JSON.stringify(context || '')
}

function metadataLabels(json: JsonObject): string {
    return JSON.stringify(objectList(json.metadata).map(entry => entry.label))
}

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
