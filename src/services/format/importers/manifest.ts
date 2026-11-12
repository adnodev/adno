import type { ProjectImage } from "../../../Utils/images"
import type { Project, ProjectSettings } from "../../../Utils/project"
import { annotationOnImages, canvasImage, commentingAnnotations, imageSourceById, items, languageText, metadataValue } from "../iiif"
import { convertAllToInternalModel } from "../internal"
import { ADNO_PROJECT, isJsonObject, objectList, type ImportOptions, type JsonObject } from "../model"
import { readRights } from "../rights"
import { buildProject, isExtension, type Description, type Extension } from "./build"

// IIIF Presentation 3 Manifest, Adno export -> legacy Base64 export or third party
// {
//     "@context": ["https://w.adno.app/ns/context.json", "http://iiif.io/api/presentation/3/context.json"],
//     "id": "https://adno.app/projects/p/manifest.json",
//     "type": "Manifest",
//     "label": { "none": ["Two folios"] },
//     "summary": { "none": ["Zones spread over two images"] },
//     "metadata": [{ "label": { "none": ["Auteur"] }, "value": { "none": ["Jane Doe"] } }],
//     "provider": [{ "id": "…#editor", "type": "Agent", "label": { "none": ["The Lab"] } }],
//     "rights": "http://creativecommons.org/licenses/by/4.0/",
//     "requiredStatement": { "label": { "none": ["Attribution"] }, "value": { "none": ["Musée de la Ville"] } },
//     "items": [{
//         "id": "https://adno.app/projects/p/canvas/1",
//         "type": "Canvas",
//         "items": [{ 
//              "type": "AnnotationPage", 
//              "items": [{ 
//                  "motivation": "painting", 
//                  "body": { "id": "…", "service": [{ "id": "…" }] } 
//              }] 
//          }],
//         "annotations": [{ "type": "AnnotationPage", "items": [{ "motivation": "commenting", "body": {…}, "target": {…} }] }]
//     }],
//     "adno:project": { "id": "p", "settings": {…}, "images": [{…}], "created": "…", "modified": "…" }
// }

function legacySettings(manifest: JsonObject): Partial<ProjectSettings> | undefined {
    const encoded = metadataValue(manifest.metadata, 'adno_settings')

    if (!encoded) {
        return undefined
    }

    try {
        return JSON.parse(atob(encoded))
    } catch {
        return undefined
    }
}

function manifestExtension(manifest: JsonObject): Extension {
    const extension = manifest[ADNO_PROJECT]

    if (isExtension(extension)) {
        return extension
    }

    return {
        created: metadataValue(manifest.metadata, 'creation_date') || undefined,
        modified: metadataValue(manifest.metadata, 'last_update') || undefined,
        settings: legacySettings(manifest)
    }
}

function isLegacyBase64Export(manifest: JsonObject): boolean {
    return metadataValue(manifest.metadata, 'adno_settings') !== ''
}

function manifestTitle(manifest: JsonObject): string {
    const metadataTitle = metadataValue(manifest.metadata, 'title')
    const label = languageText(manifest.label)

    if (isLegacyBase64Export(manifest)) {
        return metadataTitle || label
    }

    return label || metadataTitle
}

function describedByManifest(manifest: JsonObject): Description {
    const [provider] = objectList(manifest.provider)
    const statement = manifest.requiredStatement

    return {
        title: manifestTitle(manifest),
        description: languageText(manifest.summary) || metadataValue(manifest.metadata, 'description'),
        creator: metadataValue(manifest.metadata, 'Auteur') || metadataValue(manifest.metadata, 'creator'),
        editor: provider ? languageText(provider.label) : '',
        ...readRights(manifest.rights, isJsonObject(statement) ? languageText(statement.value) : '')
    }
}

function imagesFromCanvases(manifest: JsonObject): ProjectImage[] {
    return items(manifest)
        .map(canvasImage)
        .filter((image): image is ProjectImage => image !== null)
}

export function readManifest(manifest: JsonObject, options: ImportOptions): Project {
    const extension = manifestExtension(manifest)
    const canvasImages = imagesFromCanvases(manifest)
    const imageByCanvas = imageSourceById(canvasImages)

    const annotations = convertAllToInternalModel(commentingAnnotations(manifest)
        .map(annotation => annotationOnImages(annotation, imageByCanvas)))

    return buildProject(options, describedByManifest(manifest), extension, annotations, canvasImages)
}
