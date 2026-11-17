import { IIIF_TYPE, imageIndexForSource, projectImages, type ProjectImage } from "../../Utils/images"
import type { Project } from "../../Utils/project"
import { getTargets, type Annotation, type Target } from "../../Utils/targets"
import { exportAnnotation } from "./annotation"
import { iiifContext } from "./context"
import { adnoProjectForIIIF } from "./extension"
import { targetGroupId } from "../../Utils/groups"
import { annotationPageId, canvasId, manifestId, paintingPageId, projectRoot, zoneId } from "./ids"
import { ADNO_PROJECT, type ExportOptions, type JsonObject, type LanguageMap, type Manifest } from "./model"
import { CREDIT_SEPARATOR, iiifRightsUri } from "./rights"

const DATA_URL_MIME = /^data:([^;,]+)/

function languageValue(text: string): LanguageMap {
    return {
        none: [text]
    }
}

function metadataEntry(label: string, value: string): JsonObject {
    return {
        label: languageValue(label),
        value: languageValue(value)
    }
}

function editorAgent(root: string, editor: string): JsonObject {
    return {
        id: `${manifestId(root)}#editor`,
        type: 'Agent',
        label: languageValue(editor)
    }
}

function when(value: string | undefined, entry: (value: string) => JsonObject): JsonObject {
    return value ? entry(value) : {}
}

function creditLine(project: Project, rights: string | null): string {
    const unspokenLicence = rights ? undefined : project.licence

    return [project.attribution, unspokenLicence].filter(Boolean).join(CREDIT_SEPARATOR)
}

function describeProject(project: Project, root: string): JsonObject {
    const rights = project.licence ? iiifRightsUri(project.licence) : null

    return {
        label: languageValue(project.title),
        ...when(project.description, description => ({ summary: languageValue(description) })),
        ...when(project.creator, creator => ({ metadata: [metadataEntry('Auteur', creator)] })),
        ...when(project.editor, editor => ({ provider: [editorAgent(root, editor)] })),
        ...when(rights || undefined, uri => ({ rights: uri })),
        ...when(creditLine(project, rights), credit => ({ requiredStatement: metadataEntry('Attribution', credit) }))
    }
}

function canvasLabel(project: Project, images: ProjectImage[], index: number): string {
    const image = images[index]

    if (image.label) {
        return image.label
    }

    return images.length > 1 ? `${project.title} (${index + 1}/${images.length})` : project.title
}

function imageFormat(id: string): string {
    const dataUrl = DATA_URL_MIME.exec(id)

    if (dataUrl) {
        return dataUrl[1]
    }

    return /\.png$/i.test(id) ? 'image/png' : 'image/jpeg'
}

function imageBody(image: ProjectImage): JsonObject {
    const id = image.source.replace(/\/info\.json$/, '')
    const service = image.type === IIIF_TYPE
        ? {
            service: [
                {
                    id,
                    type: 'ImageService3',
                    profile: 'level1'
                }
            ]
        }
        : {}

    return {
        id,
        type: 'Image',
        format: imageFormat(id),
        ...service,
        width: image.width,
        height: image.height
    }
}

function paintingPage(image: ProjectImage, canvas: string, root: string, index: number): JsonObject {
    const page = paintingPageId(root, index)

    return {
        id: page,
        type: 'AnnotationPage',
        items: [
            {
                id: `${page}/image`,
                type: 'Annotation',
                motivation: 'painting',
                body: imageBody(image),
                target: canvas
            }
        ]
    }
}

function exportTarget(target: Target, index: number, annotation: Annotation, images: ProjectImage[], root: string): JsonObject {
    const { id, source, ...rest } = target

    return {
        type: 'SpecificResource',
        id: zoneId(root, annotation.id, targetGroupId(target), index),
        ...rest,
        source: canvasId(root, Math.max(imageIndexForSource(images, source), 0))
    }
}

function canvasIndexOf(annotation: Annotation, images: ProjectImage[]): number {
    const first = getTargets(annotation)[0]

    return Math.max(imageIndexForSource(images, first ? first.source : undefined), 0)
}

function annotationsOnCanvas(project: Project, images: ProjectImage[], index: number): Annotation[] {
    return (project.annotations || []).filter(annotation => canvasIndexOf(annotation, images) === index)
}

function annotationsPage(annotations: Annotation[], images: ProjectImage[], root: string, index: number): JsonObject {
    return {
        id: annotationPageId(root, index),
        type: 'AnnotationPage',
        items: annotations.map(annotation => exportAnnotation(annotation, root,
            (zone, index) => exportTarget(zone, index, annotation, images, root)))
    }
}

function exportCanvas(project: Project, images: ProjectImage[], index: number, root: string): JsonObject {
    const image = images[index]
    const id = canvasId(root, index)

    return {
        id,
        type: 'Canvas',
        label: languageValue(canvasLabel(project, images, index)),
        width: image.width,
        height: image.height,
        items: [paintingPage(image, id, root, index)],
        annotations: [annotationsPage(annotationsOnCanvas(project, images, index), images, root, index)]
    }
}

export function toIIIFManifest(project: Project, options: ExportOptions): Manifest {
    const root = projectRoot(options.base, project.id)
    const images = projectImages(project)

    return {
        '@context': iiifContext(),
        id: manifestId(root),
        type: 'Manifest',
        ...describeProject(project, root),
        items: images.map((_, index) => exportCanvas(project, images, index, root)),
        [ADNO_PROJECT]: adnoProjectForIIIF(project)
    }
}
