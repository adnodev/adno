import { IIIF_TYPE, IMAGE_TYPE, type ProjectImage } from "../../../Utils/images"
import type { Project } from "../../../Utils/project"
import { annotationOnImages, imageSourceById, infoJsonUrl, languageText } from "../iiif"
import { convertAllToInternalModel } from "../internal"
import { COMMENTING, type Body, type ImportOptions, type JsonObject } from "../model"
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
    const [sequence] = Array.isArray(manifest.sequences) ? manifest.sequences : []

    return sequence && Array.isArray(sequence.canvases) ? sequence.canvases : []
}

function serviceIdV2(resource: JsonObject): string | undefined {
    const service = Array.isArray(resource.service) ? resource.service[0] : resource.service

    return service ? service['@id'] || service.id : undefined
}

function canvasImageV2(canvas: JsonObject): ProjectImage | null {
    const [painting] = Array.isArray(canvas.images) ? canvas.images : []
    const resource = painting ? painting.resource as JsonObject | undefined : undefined

    if (!resource) {
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
    const motivations = Array.isArray(resource.motivation) ? resource.motivation : [resource.motivation]

    return motivations.some(motivation => String(motivation).endsWith(COMMENTING))
}

function textualBodyV2(resource: JsonObject | undefined): Body | undefined {
    if (!resource) {
        return undefined
    }

    return {
        type: 'TextualBody',
        value: String(resource.chars || ''),
        format: String(resource.format || 'text/plain'),
        purpose: COMMENTING
    }
}

function annotationFromV2(resource: JsonObject): JsonObject {
    return {
        id: resource['@id'],
        type: 'Annotation',
        motivation: COMMENTING,
        body: textualBodyV2(resource.resource as JsonObject | undefined),
        target: resource.on
    }
}

export function commentingAnnotationsV2(manifest: JsonObject): JsonObject[] {
    return canvasesV2(manifest)
        .flatMap(canvas => Array.isArray(canvas.otherContent) ? canvas.otherContent : [])
        .filter(list => typeof list === 'object')
        .flatMap(list => Array.isArray(list.resources) ? list.resources : [])
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
