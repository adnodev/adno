import { IIIF_TYPE, IMAGE_TYPE, isImageUrl, type ProjectImage } from "../../../Utils/images"
import type { Project, ProjectSettings } from "../../../Utils/project"
import { items } from "../iiif"
import { convertAllToInternalModel, readForeignTargets } from "../internal"
import { ADNO_PROJECT, isJsonObject, objectList, type ImportOptions, type JsonObject } from "../model"
import { rightsFields } from "../rights"
import { buildProject, type Description, type Extension } from "./build"

// Web Annotation collection, as read here (Adno export, legacy Adno export or third party):
// {
//     "@context": ["https://w.adno.app/ns/context.json", "http://www.w3.org/ns/anno.jsonld"],
//     "id": "https://adno.app/projects/p/collection.json",
//     "type": "AnnotationCollection",
//     "label": "Two folios",
//     "creator": { "type": "Person", "name": "Jane Doe" },
//     "created": "2026-07-01T00:00:00.000Z",
//     "modified": "2026-07-01T00:00:00.000Z",
//     "total": 1,
//     "first": { "type": "AnnotationPage", "items": [{ "id": "…/annotations/zone-recto", "body": {…}, "target": { "id": "g1@#zone-recto", "source": "…", "selector": {…} } }] },
//     "adno:project": { "id": "p", "settings": {…}, "images": [{…}], "description": "…", "editor": "…", "licence": "…", "attribution": "…" }
// }
// Legacy export: "title", "date", "source", "format": "Adno", "adno_settings", "rights" instead of "adno:project".

type CollectionExtension = Extension & Partial<Pick<Project, 'description' | 'editor' | 'licence' | 'attribution'>>

function isCollectionExtension(value: unknown): value is CollectionExtension {
    return isJsonObject(value)
}

function isProjectSettings(value: unknown): value is Partial<ProjectSettings> {
    return isJsonObject(value)
}

function text(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined
}

function imageForSource(source: string): ProjectImage {
    return {
        id: source,
        source,
        label: '',
        type: isImageUrl(source) ? IMAGE_TYPE : IIIF_TYPE
    }
}

function imagesFromTargets(annotations: JsonObject[]): ProjectImage[] {
    const sources = annotations
        .flatMap(readForeignTargets)
        .map(target => target.source)
        .filter((source): source is string => typeof source === 'string')

    return [...new Set(sources)].map(imageForSource)
}

function isProjectImage(image: JsonObject): image is ProjectImage {
    return typeof image.source === 'string'
}

function legacyImages(collection: JsonObject): ProjectImage[] | undefined {
    const images = objectList(collection.images).filter(isProjectImage)

    if (images.length > 0) {
        return images
    }

    const source = text(collection.source)

    return source ? [imageForSource(source)] : undefined
}

function collectionExtension(collection: JsonObject): CollectionExtension {
    const extension = collection[ADNO_PROJECT]

    const dates = {
        created: text(collection.created) || text(collection.date),
        modified: text(collection.modified)
    }

    if (isCollectionExtension(extension)) {
        return {
            ...extension,
            ...dates
        }
    }

    const legacySettings = collection.adno_settings

    return {
        ...dates,
        settings: isProjectSettings(legacySettings) ? legacySettings : undefined,
        images: legacyImages(collection),
        description: text(collection.description),
        editor: text(collection.editor),
        ...rightsFields(text(collection.rights))
    }
}

function creatorName(creator: unknown): string {
    if (isJsonObject(creator)) {
        return text(creator.name) || ''
    }

    return text(creator) || ''
}

function describedByCollection(collection: JsonObject, extension: CollectionExtension): Description {
    return {
        title: text(collection.label) || text(collection.title) || '',
        description: extension.description || '',
        creator: creatorName(collection.creator),
        editor: extension.editor || '',
        ...(extension.licence ? { licence: extension.licence } : {}),
        ...(extension.attribution ? { attribution: extension.attribution } : {})
    }
}

export function readCollection(collection: JsonObject, options: ImportOptions): Project {
    const extension = collectionExtension(collection)
    const firstPage = collection.first
    const foreign = isJsonObject(firstPage) ? items(firstPage) : []
    const annotations = convertAllToInternalModel(foreign)

    return buildProject(options, describedByCollection(collection, extension), extension, annotations, imagesFromTargets(foreign))
}
