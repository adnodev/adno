import { enhancedFetch } from "../../Utils/utils"
import { IIIF_TYPE, projectImages, withImages } from "../../Utils/images"
import { toIIIFManifest } from "./manifest"

const PUBLIC_BASE = 'https://adno.app'
const LOCAL_HOSTS = ['localhost', '127.0.0.1']

export function exportBase() {
    const { protocol, hostname, origin } = window.location

    if (protocol === 'file:' || origin === 'null' || LOCAL_HOSTS.includes(hostname)) {
        return PUBLIC_BASE
    }

    return `${origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '')
}

async function infoSize(source) {
    const url = source.endsWith('info.json') ? source : `${source}/info.json`
    const fetched = await enhancedFetch(url)
    const response = fetched && fetched.response

    if (!response || typeof response.json !== 'function') {
        return {}
    }

    return response.json()
        .then(info => ({ width: info.width, height: info.height }))
        .catch(() => ({}))
}

function measureImage(source) {
    return new Promise(resolve => {
        const image = new Image()

        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => resolve({})
        image.src = source
    })
}

async function sizedImage(image) {
    if (image.width && image.height) {
        return image
    }

    const probed = image.type === IIIF_TYPE ? await infoSize(image.source) : await measureImage(image.source)

    return { ...image, ...probed }
}

export function withImageSizes(project) {
    return Promise.all(projectImages(project).map(sizedImage))
        .then(images => withImages(project, images))
}

export function exportManifest(project) {
    return withImageSizes(project).then(sized => toIIIFManifest(sized, { base: exportBase() }))
}
