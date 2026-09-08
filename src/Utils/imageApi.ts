import { IIIF_TYPE, imageIndexForSource, type ProjectImage } from "./images"
import { targetBox, type Target } from "./targets"

const QUALITY = 'default.jpg'

export function imageApiUrl(target: Target, images: ProjectImage[], rotation: number | null): string | null {
    const image = images[imageIndexForSource(images, target.source)]

    if (!image || image.type !== IIIF_TYPE) {
        return null
    }

    const box = targetBox(target)

    if (!box) {
        return null
    }

    const region = [box.x, box.y, box.width, box.height].map(Math.round).join(',')
    const size = `${Math.round(box.width)},`

    return `${image.source.replace(/\/info\.json$/, '')}/${region}/${size}/${rotation || 0}/${QUALITY}`
}
