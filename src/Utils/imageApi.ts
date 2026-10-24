import { IIIF_TYPE, imageIndexForSource, type ProjectImage } from "./images"
import { normalizeAngle } from "./orientation"
import { targetBox, type Target } from "./targets"

const OPAQUE_FORMAT = 'default.jpg'
const TRANSPARENT_FORMAT = 'default.png'
const QUARTER_TURN = 90

type ImageApiSize = 'full' | 'max'
type ImageApiRotation = 'arbitrary' | 'quarter' | 'none'

type ImageApiServer = {
    size: ImageApiSize,
    rotation: ImageApiRotation
}

export type ImageApiLink = {
    url: string,
    requested: number,
    applied: number,
    degraded: boolean
}

const UNKNOWN_SERVER: ImageApiServer = {
    size: 'full',
    rotation: 'quarter'
}

const servers = new Map<string, ImageApiServer>()

function appliedRotation(capability: ImageApiRotation, requested: number): number {
    if (capability === 'arbitrary') {
        return requested
    }

    if (capability === 'quarter') {
        return normalizeAngle(Math.round(requested / QUARTER_TURN) * QUARTER_TURN)
    }

    return 0
}

// Image API (4.3): a free angle leaves empty corners, only PNG keeps them transparent
//   quarter turn (0/90/180/270) -> default.jpg  no corners and jpg required at every level
//   any other angle             -> default.png  (transparent corners, png required at level2)
function outputFormat(applied: number): string {
    if (applied % QUARTER_TURN !== 0) {
        return TRANSPARENT_FORMAT
    }

    return OPAQUE_FORMAT
}

type InfoJson = {
    version?: number,
    profile?: unknown,
    extraFeatures?: string[]
}

type ProfileEntry = {
    supports?: string[]
}

function profileLevel(profile: unknown): number {
    const first = Array.isArray(profile) ? profile[0] : profile
    const found = typeof first === 'string' ? /level(\d)/.exec(first) : null

    return found ? Number(found[1]) : 0
}

function declaredFeatures(info: InfoJson): string[] {
    const entries: ProfileEntry[] = Array.isArray(info.profile) ? info.profile.filter(entry => typeof entry === 'object') : []
    const supported = entries.flatMap(entry => entry.supports || [])

    return supported.concat(info.extraFeatures || [])
}

function rotationCapability(info: InfoJson): ImageApiRotation {
    const features = declaredFeatures(info)

    if (features.includes('rotationArbitrary')) {
        return 'arbitrary'
    }

    if (profileLevel(info.profile) >= 2 || features.includes('rotationBy90s')) {
        return 'quarter'
    }

    return 'none'
}

export function rememberImageApi(source: string | undefined, tileSource: InfoJson | undefined): void {
    if (!source || !tileSource || !tileSource.version) {
        return
    }

    servers.set(source, {
        size: tileSource.version >= 3 ? 'max' : 'full',
        rotation: rotationCapability(tileSource)
    })
}

export function imageApiUrl(target: Target, images: ProjectImage[], rotation: number | null): ImageApiLink | null {
    const image = images[imageIndexForSource(images, target.source)]

    if (!image || image.type !== IIIF_TYPE) {
        return null
    }

    const box = targetBox(target)

    if (!box) {
        return null
    }

    const region = [box.x, box.y, box.width, box.height].map(Math.round).join(',')

    const server = servers.get(image.source) || UNKNOWN_SERVER
    
    const requested = rotation === null ? 0 : normalizeAngle(Math.round(rotation))
    
    const applied = appliedRotation(server.rotation, requested)
    const base = image.source.replace(/\/info\.json$/, '')

    return {
        url: `${base}/${region}/${server.size}/${applied}/${outputFormat(applied)}`,
        requested,
        applied,
        degraded: applied !== requested
    }
}
