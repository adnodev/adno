import type { Project } from "./project"

export const IIIF_TYPE = 'iiif'
export const IMAGE_TYPE = 'image'

export type ImageType = typeof IIIF_TYPE | typeof IMAGE_TYPE

export type ProjectImage = {
    source: string,
    type: ImageType,
    id?: string,
    label?: string,
    width?: number,
    height?: number
}

const IMAGE_EXTENSIONS = (process.env.GRANTED_IMG_EXTENSIONS || 'jpg,png,jpeg').split(',')
const IPFS_GATEWAY = process.env.IPFS_GATEWAY

function urlExtension(url: string): string {
    return url.split(/[#?]/)[0].split('.').pop() || ''
}

export function isImageUrl(url: string): boolean {
    if (url.startsWith('data:')) {
        return true
    }

    if (IPFS_GATEWAY && url.startsWith(IPFS_GATEWAY)) {
        return true
    }

    return IMAGE_EXTENSIONS.includes(urlExtension(url))
}

export type ImageIndex = number

export type TileSource = string | { type: typeof IMAGE_TYPE, url: string }

export function projectImages(project: Project | null): ProjectImage[] {
    if (!project) {
        return []
    }

    if (Array.isArray(project.images) && project.images.length > 0) {
        return project.images
    }

    const source = project.manifest_url || project.img_url

    if (!source) {
        return []
    }

    return [{
        id: source,
        source,
        label: '',
        type: project.manifest_url ? IIIF_TYPE : IMAGE_TYPE
    }]
}

export function withImages(project: Project, images: ProjectImage[]): Project {
    const { manifest_url, img_url, ...rest } = project
    const primary = images.length > 0 ? images[0] : null

    if (!primary) {
        return { ...rest, images: [] }
    }

    const mirror = primary.type === IIIF_TYPE
        ? { manifest_url: primary.source }
        : { img_url: primary.source }

    return { ...rest, ...mirror, images }
}

export function imageTileSource(image: ProjectImage | undefined): TileSource | null {
    if (!image) {
        return null
    }

    return image.type === IIIF_TYPE ? image.source : { type: 'image', url: image.source }
}

export function imageThumbnail(image: ProjectImage | undefined, height: number): string | null {
    if (!image) {
        return null
    }

    if (image.type !== IIIF_TYPE) {
        return image.source
    }

    return `${image.source.replace(/\/info\.json$/, '')}/full/,${height}/0/default.jpg`
}

export function imageIndexForSource(images: ProjectImage[], source: string | undefined): ImageIndex {
    const index = images.findIndex(image => image.source === source)

    return index === -1 && images.length === 1 ? 0 : index
}
