import { IIIF_TYPE, type ProjectImage } from "../../../Utils/images"
import type { Project } from "../../../Utils/project"
import { infoJsonUrl } from "../iiif"
import type { ImportOptions, JsonObject } from "../model"
import { buildProject } from "./build"

// IIIF Image API info.json, as read here:
// {
//     "@context": "http://iiif.io/api/image/3/context.json",
//     "id": "https://example.org/iiif/img",
//     "type": "ImageService3",
//     "width": 2406,
//     "height": 3479
// }

function serviceImage(info: JsonObject): ProjectImage {
    const source = infoJsonUrl(String(info.id || info['@id']))

    return {
        id: source,
        source,
        label: '',
        type: IIIF_TYPE,
        width: Number(info.width) || undefined,
        height: Number(info.height) || undefined
    }
}

export function readImageInfo(info: JsonObject, options: ImportOptions): Project {
    const description = {
        title: '',
        description: '',
        creator: '',
        editor: ''
    }

    return buildProject(options, description, {}, [], [serviceImage(info)])
}
