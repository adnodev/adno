import type { Project } from "../../Utils/project"
import { detectFormat, type Format } from "./detect"
import { readCollection } from "./importers/collection"
import { readImageInfo } from "./importers/image-info"
import { readManifest } from "./importers/manifest"
import { readManifestV2 } from "./importers/manifest-v2"
import type { ImportOptions, JsonObject } from "./model"
import { normalizeProject } from "./normalize"

type Reader = (json: JsonObject, options: ImportOptions) => Project

const READERS: Partial<Record<Format, Reader>> = {
    'adno-manifest': readManifest,
    'legacy-base64-manifest': readManifest,
    'iiif-manifest': readManifest,
    'iiif-v2': readManifestV2,
    'adno-collection': readCollection,
    'legacy-collection': readCollection,
    'annotation-collection': readCollection,
    'image-info': readImageInfo
}

export function fromAny(json: JsonObject, options: ImportOptions): Project | null {
    const read = READERS[detectFormat(json)]

    if (!read) {
        return null
    }

    return normalizeProject(read(json, options)).project
}
