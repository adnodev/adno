import type { Project } from "../../Utils/project"

type LegacyRights = {
    rights?: string
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
