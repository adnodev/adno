import { IIIF_TYPE, IMAGE_TYPE, type ProjectImage } from "../../Utils/images"
import type { Target } from "../../Utils/targets"
import { asList, COMMENTING, isJsonObject, objectList, type JsonObject } from "./model"

const PREFERRED_LANGUAGES = ['none', 'en', 'fr']
const MEDIA_FRAGMENTS = 'http://www.w3.org/TR/media-frags/'

function firstText(values: unknown): string {
    const [first] = asList(values)

    if (typeof first === 'string') {
        return first
    }

    if (!isJsonObject(first)) {
        return ''
    }

    return typeof first['@value'] === 'string' ? first['@value'] : ''
}

export function metadataValue(metadata: unknown, label: string): string {
    const entries = objectList(metadata)
    const wanted = label.toLowerCase()
    const entry = entries.find(item => languageText(item.label).toLowerCase() === wanted)

    return entry ? languageText(entry.value) : ''
}

export function infoJsonUrl(service: string): string {
    return service.endsWith('info.json') ? service : `${service}/info.json`
}

export function items(node: JsonObject | undefined): JsonObject[] {
    return node ? objectList(node.items) : []
}

function isCommenting(annotation: JsonObject): boolean {
    return asList(annotation.motivation).includes(COMMENTING)
}

export function commentingAnnotations(manifest: JsonObject): JsonObject[] {
    return items(manifest)
        .flatMap(canvas => objectList(canvas.annotations))
        .flatMap(page => items(page))
        .filter(isCommenting)
}

function serviceId(body: JsonObject): string | undefined {
    const [service] = objectList(body.service)
    const id = service ? service.id || service['@id'] : undefined

    return typeof id === 'string' ? id : undefined
}

export function canvasImage(canvas: JsonObject): ProjectImage | null {
    const painted = items(items(canvas)[0])[0]?.body

    if (!isJsonObject(painted)) {
        return null
    }

    const service = serviceId(painted)
    const source = service ? infoJsonUrl(service) : painted.id

    if (typeof source !== 'string') {
        return null
    }

    return {
        id: String(canvas.id),
        source,
        type: service ? IIIF_TYPE : IMAGE_TYPE,
        label: languageText(canvas.label),
        width: Number(painted.width || canvas.width) || undefined,
        height: Number(painted.height || canvas.height) || undefined
    }
}

function withPixelUnit(fragment: string): string {
    return fragment.replace(/^xywh=(?!pixel:|percent:)/, 'xywh=pixel:')
}

export function targetFromReference(reference: string): Target {
    const [source, fragment] = reference.split('#')

    if (!fragment) {
        return { source }
    }

    return {
        source,
        selector: {
            type: 'FragmentSelector',
            conformsTo: MEDIA_FRAGMENTS,
            value: withPixelUnit(fragment)
        }
    }
}

function withMediaFragments(target: Target): Target {
    const selector = target.selector

    if (!selector || selector.type !== 'FragmentSelector') {
        return target
    }

    return {
        ...target,
        selector: {
            ...selector,
            conformsTo: selector.conformsTo || MEDIA_FRAGMENTS,
            value: withPixelUnit(selector.value || '')
        }
    }
}

export function imageSourceById(images: ProjectImage[]): Map<string, string> {
    return new Map(images.map(image => [String(image.id), image.source]))
}

function canvasIdOf(source: unknown): string | undefined {
    if (typeof source === 'string') {
        return source
    }

    if (!isJsonObject(source)) {
        return undefined
    }

    const id = source.id || source['@id']

    return typeof id === 'string' ? id : undefined
}

export function retargetFromCanvasToImage(target: Target | string, imageByCanvas: Map<string, string>): Target {
    const resource = typeof target === 'string' ? targetFromReference(target) : withMediaFragments(target)
    const canvasId = canvasIdOf(resource.source)

    if (!canvasId) {
        return resource
    }

    return {
        ...resource,
        source: imageByCanvas.get(canvasId) || canvasId
    }
}

export function isTargetLike(target: unknown): target is Target | string {
    return typeof target === 'string' || isJsonObject(target)
}

export function annotationOnImages(annotation: JsonObject, imageByCanvas: Map<string, string>): JsonObject {
    const targets = asList(annotation.target).filter(isTargetLike)

    return {
        ...annotation,
        target: targets.map(target => retargetFromCanvasToImage(target, imageByCanvas))
    }
}

export function languageText(value: unknown): string {
    if (!isJsonObject(value)) {
        return firstText(value)
    }

    const language = PREFERRED_LANGUAGES.find(code => value[code]) || Object.keys(value)[0]

    return language ? firstText(value[language]) : ''
}
