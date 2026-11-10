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

export const CREDIT_SEPARATOR = ' — '

type Rights = Pick<Project, 'licence' | 'attribution'>

function present(rights: Rights): Rights {
    return Object.fromEntries(Object.entries(rights).filter(([, value]) => value))
}

export function readRights(rights: unknown, statement: string): Rights {
    const parts = statement.split(CREDIT_SEPARATOR)
    const trailing = parts[parts.length - 1]
    const licenceInStatement = parts.length > 1 && isLicenceUrl(trailing)

    if (typeof rights === 'string') {
        return present({
            licence: rights,
            attribution: statement
        })
    }

    if (!licenceInStatement) {
        return rightsFields(statement)
    }

    return {
        licence: trailing,
        attribution: parts.slice(0, -1).join(CREDIT_SEPARATOR)
    }
}

export function rightsFields(rights: string | undefined): Rights {
    if (!rights) {
        return {}
    }

    if (isLicenceUrl(rights)) {
        return {
            licence: rights
        }
    }

    return {
        attribution: rights
    }
}

export function splitRights(record: Project & LegacyRights): Project {
    const { rights, ...rest } = record

    return {
        ...rest,
        ...rightsFields(rights)
    }
}
