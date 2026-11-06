import { projectImages } from "../../Utils/images"
import { defaultProjectSettings, type Project } from "../../Utils/project"
import type { JsonObject } from "./model"

export const GENERATOR = {
    id: 'https://adno.app',
    type: 'Software',
    name: 'Adno'
}

function adnoCore(project: Project): JsonObject {
    return {
        id: project.id,
        settings: project.settings || defaultProjectSettings(),
        images: projectImages(project)
    }
}

function present(fields: Record<string, string | undefined>): JsonObject {
    return Object.fromEntries(Object.entries(fields).filter(([, value]) => value))
}

export function adnoProjectForIIIF(project: Project): JsonObject {
    return {
        ...adnoCore(project),
        created: project.creation_date,
        modified: project.last_update,
        generator: GENERATOR
    }
}

export function adnoProjectForWADM(project: Project): JsonObject {
    return {
        ...adnoCore(project),
        ...present({
            description: project.description,
            editor: project.editor,
            licence: project.licence,
            attribution: project.attribution
        })
    }
}
