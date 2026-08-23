const IIIF_TYPE = 'iiif'
const IMAGE_TYPE = 'image'

export function projectImages(project) {
    if (project && Array.isArray(project.images) && project.images.length > 0) {
        return project.images
    }

    const source = project && (project.manifest_url || project.img_url)

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

export function withImages(project, images) {
    const { manifest_url, img_url, ...rest } = project
    const list = images || []
    const primary = list.length > 0 ? list[0] : null

    if (!primary) {
        return { ...rest, images: list }
    }

    const mirror = primary.type === IIIF_TYPE
        ? { manifest_url: primary.source }
        : { img_url: primary.source }

    return { ...rest, ...mirror, images: list }
}

export function imageTileSource(image) {
    if (!image) {
        return null
    }

    return image.type === IIIF_TYPE ? image.source : { type: 'image', url: image.source }
}

export function imageThumbnail(image, height) {
    if (!image) {
        return null
    }

    if (image.type !== IIIF_TYPE) {
        return image.source
    }

    return `${image.source.replace(/\/info\.json$/, '')}/full/,${height}/0/default.jpg`
}

export function findImage(images, id) {
    return (images || []).find(image => image.id === id) || null
}

export function imageIndexForSource(images, source) {
    const list = images || []
    const index = list.findIndex(image => image.source === source)

    return index === -1 && list.length === 1 ? 0 : index
}
