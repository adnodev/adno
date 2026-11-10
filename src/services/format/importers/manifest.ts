import type { ProjectImage } from "../../../Utils/images"
import type { Project, ProjectSettings } from "../../../Utils/project"
import { annotationOnImages, canvasImage, commentingAnnotations, imageSourceById, items, languageText, metadataValue } from "../iiif"
import { convertAllToInternalModel } from "../internal"
import { ADNO_PROJECT, type ImportOptions, type JsonObject } from "../model"
import { readRights } from "../rights"
import { buildProject, type Description, type Extension } from "./build"

// IIIF Presentation 3 Manifest, as read here (Adno export, legacy Base64 export or third party):
// {
//     "@context": ["https://adno.app/ns/context.json", "http://iiif.io/api/presentation/3/context.json"],
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

    return encoded ? JSON.parse(atob(encoded)) : undefined
}

function manifestExtension(manifest: JsonObject): Extension {
    const extension = manifest[ADNO_PROJECT] as Extension | undefined

    if (extension) {
        return extension
    }

    return {
        created: metadataValue(manifest.metadata, 'creation_date') || undefined,
        modified: metadataValue(manifest.metadata, 'last_update') || undefined,
        settings: legacySettings(manifest)
    }
}

function describedByManifest(manifest: JsonObject): Description {
    const [provider] = Array.isArray(manifest.provider) ? manifest.provider : []
    const statement = manifest.requiredStatement as JsonObject | undefined

    return {
        title: metadataValue(manifest.metadata, 'title') || languageText(manifest.label),
        description: languageText(manifest.summary) || metadataValue(manifest.metadata, 'description'),
        creator: metadataValue(manifest.metadata, 'Auteur') || metadataValue(manifest.metadata, 'creator'),
        editor: provider ? languageText(provider.label) : '',
        ...readRights(manifest.rights, statement ? languageText(statement.value) : '')
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
