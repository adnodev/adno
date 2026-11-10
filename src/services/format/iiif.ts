import { IIIF_TYPE, IMAGE_TYPE, type ProjectImage } from "../../Utils/images"
import { withTargets, type Annotation, type Target } from "../../Utils/targets"
import { COMMENTING, type JsonObject } from "./model"

const PREFERRED_LANGUAGES = ['none', 'en', 'fr']
const MEDIA_FRAGMENTS = 'http://www.w3.org/TR/media-frags/'

// ["Two folios"]                                  -> "Two folios"
// "Two folios"                                    -> "Two folios"
// [{ "@value": "Folio", "@language": "fr" }]      -> "Folio"        (IIIF v2 label)
// undefined, [], 42                               -> ""
function firstText(values: unknown): string {
    const first = Array.isArray(values) ? values[0] : values

    if (typeof first === 'string') {
        return first
    }

    return first && typeof first === 'object' && typeof first['@value'] === 'string' ? first['@value'] : ''
}

// metadata [{ label: { fr: ["Auteur"] }, value: { fr: ["Auteur de test"] } }], "Auteur"  -> "Auteur de test"
// metadata [{ label: { en: ["title"] }, value: { en: ["second"] } }], "Title"            -> "second"
// metadata undefined, or no entry with that label                                        -> ""
export function metadataValue(metadata: unknown, label: string): string {
    const entries = Array.isArray(metadata) ? metadata : []
    const wanted = label.toLowerCase()
    const entry = entries.find(item => languageText(item.label).toLowerCase() === wanted)

    return entry ? languageText(entry.value) : ''
}

export function infoJsonUrl(service: string): string {
    return service.endsWith('info.json') ? service : `${service}/info.json`
}

// { items: [a, b] } -> [a, b] ; no items -> []
export function items(node: JsonObject | undefined): JsonObject[] {
    return node && Array.isArray(node.items) ? node.items : []
}

// motivation "commenting"              -> true
// motivation ["commenting", "tagging"] -> true
// motivation "painting"                -> false
function isCommenting(annotation: JsonObject): boolean {
    const motivations = Array.isArray(annotation.motivation) ? annotation.motivation : [annotation.motivation]

    return motivations.includes(COMMENTING)
}

// Manifest { items: [canvas { annotations: [page { items: [commenting, painting] }] }] } -> [commenting]
export function commentingAnnotations(manifest: JsonObject): JsonObject[] {
    return items(manifest)
        .flatMap(canvas => Array.isArray(canvas.annotations) ? canvas.annotations : [])
        .flatMap(page => items(page))
        .filter(isCommenting)
}

function serviceId(body: JsonObject): string | undefined {
    const [service] = Array.isArray(body.service) ? body.service : []

    return service ? service.id || service['@id'] : undefined
}

// Canvas painted with a service  -> { id: canvas.id, source: ".../info.json", type: "iiif", label, width, height }
// Canvas painted with a plain image -> { ..., source: body.id, type: "image" } ; nothing painted -> null
export function canvasImage(canvas: JsonObject): ProjectImage | null {
    const painted = items(items(canvas)[0])[0]?.body as JsonObject | undefined

    if (!painted) {
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

function targetFromReference(reference: string): Target {
    const [source, fragment] = reference.split('#')

    if (!fragment) {
        return { source }
    }

    return {
        source,
        selector: {
            type: 'FragmentSelector',
            conformsTo: MEDIA_FRAGMENTS,
            value: fragment.replace('xywh=', 'xywh=pixel:')
        }
    }
}

function withMediaFragments(target: Target): Target {
    const selector = target.selector

    if (!selector || selector.type !== 'FragmentSelector' || selector.conformsTo) {
        return target
    }

    return {
        ...target,
        selector: {
            ...selector,
            conformsTo: MEDIA_FRAGMENTS
        }
    }
}

export function imageSourceById(images: ProjectImage[]): Map<string, string> {
    return new Map(images.map(image => [String(image.id), image.source]))
}

export function retargetFromCanvasToImage(target: Target | string, imageByCanvas: Map<string, string>): Target {
    const resource = typeof target === 'string' ? targetFromReference(target) : withMediaFragments(target)
    const image = resource.source ? imageByCanvas.get(resource.source) : undefined

    return image ? { ...resource, source: image } : resource
}

export function annotationOnImages(annotation: JsonObject, imageByCanvas: Map<string, string>): Annotation {
    const targets = Array.isArray(annotation.target) ? annotation.target : [annotation.target]

    return withTargets(
        annotation as Annotation,
        targets.filter(Boolean).map(target => retargetFromCanvasToImage(target, imageByCanvas)))
}

export function languageText(value: unknown): string {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return firstText(value)
    }

    const map = value as Record<string, unknown>
    const language = PREFERRED_LANGUAGES.find(code => map[code]) || Object.keys(map)[0]

    return language ? firstText(map[language]) : ''
}
