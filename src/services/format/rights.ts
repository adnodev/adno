import type { Project } from "../../Utils/project"

const IIIF_RIGHTS = /^https?:\/\/((?:creativecommons|rightsstatements)\.org\/.+)$/

type LegacyRights = {
    rights?: string
}

export function iiifRightsUri(licence: string): string | null {
    const found = IIIF_RIGHTS.exec(licence)

    return found ? `http://${found[1]}` : null
}

function isLicenceUrl(rights: string): boolean {
    return rights.startsWith('http')
}

export function splitRights(record: Project & LegacyRights): Project {
    const { rights, ...rest } = record

    if (!rights) {
        return rest
    }

    if (isLicenceUrl(rights)) {
        return {
            ...rest,
            licence: rights
        }
    }

    return {
        ...rest,
        attribution: rights
    }
}
