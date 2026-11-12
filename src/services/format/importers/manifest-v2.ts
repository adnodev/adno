import { IIIF_TYPE, IMAGE_TYPE, type ProjectImage } from "../../../Utils/images"
import type { Project } from "../../../Utils/project"
import type { Selector } from "../../../Utils/targets"
import { annotationOnImages, imageSourceById, infoJsonUrl, languageText } from "../iiif"
import { convertAllToInternalModel } from "../internal"
import { asList, COMMENTING, isJsonObject, objectList, type Body, type ImportOptions, type JsonObject } from "../model"
import { buildProject } from "./build"

// IIIF Presentation 2 Manifest, as read here:
// {
//     "@context": "http://iiif.io/api/presentation/2/context.json",
//     "@id": "https://example.org/manifest",
//     "@type": "sc:Manifest",
//     "label": [{ "@value": "Folio", "@language": "fr" }],
//     "sequences": [{
//         "canvases": [{
//             "@id": "https://example.org/canvas/1",
//             "label": "Folio 1r",
//             "width": 2406,
//             "height": 3479,
//             "images": [{
//                 "resource": {
//                     "@id": "https://example.org/iiif/img/full/full/0/default.jpg",
//                     "service": { "@id": "https://example.org/iiif/img" },
//                     "width": 2406,
//                     "height": 3479
//                 }
//             }],
//             "otherContent": [{
//                 "@type": "sc:AnnotationList",
//                 "resources": [{
//                     "@id": "https://example.org/anno/1",
//                     "motivation": "oa:commenting",
//                     "resource": { "@type": "dctypes:Text", "chars": "<p>Un mot</p>", "format": "text/html" },
//                     "on": "https://example.org/canvas/1#xywh=10,10,80,60"
//                 }]
//             }]
//         }]
//     }]
// }

function canvasesV2(manifest: JsonObject): JsonObject[] {
    const [sequence] = objectList(manifest.sequences)

    return sequence ? objectList(sequence.canvases) : []
}

function serviceIdV2(resource: JsonObject): string | undefined {
    const [service] = objectList(asList(resource.service))
    const id = service ? service['@id'] || service.id : undefined

    return typeof id === 'string' ? id : undefined
}

function canvasImageV2(canvas: JsonObject): ProjectImage | null {
    const [painting] = objectList(canvas.images)
    const resource = painting?.resource

    if (!isJsonObject(resource)) {
        return null
    }

    const service = serviceIdV2(resource)
    const source = service ? infoJsonUrl(service) : resource['@id']

    if (typeof source !== 'string') {
        return null
    }

    return {
        id: String(canvas['@id']),
        source,
        type: service ? IIIF_TYPE : IMAGE_TYPE,
        label: languageText(canvas.label),
        width: Number(resource.width || canvas.width) || undefined,
        height: Number(resource.height || canvas.height) || undefined
    }
}

function isCommentingV2(resource: JsonObject): boolean {
    return asList(resource.motivation).some(motivation => String(motivation).endsWith(COMMENTING))
}

function textualBodyV2(resource: unknown): Body | undefined {
    if (!isJsonObject(resource)) {
        return undefined
    }

    return {
        type: 'TextualBody',
        value: String(resource.chars || ''),
        format: String(resource.format || 'text/plain'),
        purpose: COMMENTING
    }
}

function selectorFromV2(selector: JsonObject): Selector {
    const chosen = selector['@type'] === 'oa:Choice' && isJsonObject(selector.default)
        ? selector.default
        : selector

    return {
        type: String(chosen['@type'] || '').replace('oa:', ''),
        value: String(chosen.value || '')
    }
}

function targetFromV2(on: unknown): unknown {
    if (Array.isArray(on)) {
        return on.map(targetFromV2)
    }

    if (!isJsonObject(on)) {
        return on
    }

    if (!isJsonObject(on.selector)) {
        return {
            source: on.full
        }
    }

    return {
        source: on.full,
        selector: selectorFromV2(on.selector)
    }
}

function annotationFromV2(resource: JsonObject): JsonObject {
    return {
        id: resource['@id'],
        type: 'Annotation',
        motivation: COMMENTING,
        body: textualBodyV2(resource.resource),
        target: targetFromV2(resource.on)
    }
}

function commentingAnnotationsV2(manifest: JsonObject): JsonObject[] {
    return canvasesV2(manifest)
        .flatMap(canvas => objectList(canvas.otherContent))
        .flatMap(list => objectList(list.resources))
        .filter(isCommentingV2)
        .map(annotationFromV2)
}

function canvasImagesV2(manifest: JsonObject): ProjectImage[] {
    return canvasesV2(manifest)
        .map(canvasImageV2)
        .filter((image): image is ProjectImage => image !== null)
}

export function readManifestV2(manifest: JsonObject, options: ImportOptions): Project {
    const canvasImages = canvasImagesV2(manifest)
    const imageByCanvas = imageSourceById(canvasImages)

    const annotations = convertAllToInternalModel(commentingAnnotationsV2(manifest)
        .map(annotation => annotationOnImages(annotation, imageByCanvas)))

    const description = {
        title: languageText(manifest.label),
        description: languageText(manifest.description),
        creator: '',
        editor: ''
    }

    return buildProject(options, description, {}, annotations, canvasImages)
}
