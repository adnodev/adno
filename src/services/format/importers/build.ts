import { withImages, type ProjectImage } from "../../../Utils/images"
import { defaultProjectSettings, type Project, type ProjectSettings } from "../../../Utils/project"
import type { Annotation } from "../../../Utils/targets"
import type { ImportOptions } from "../model"

export type Description = Pick<Project, 'title' | 'description' | 'creator' | 'editor' | 'licence' | 'attribution'>

export type Extension = {
    created?: string,
    modified?: string,
    settings?: Partial<ProjectSettings>,
    images?: ProjectImage[]
}

export function buildProject(options: ImportOptions, description: Description, extension: Extension, annotations: Annotation[], images: ProjectImage[]): Project {
    const now = new Date().toISOString()

    return withImages({
        id: options.id,
        ...description,
        creation_date: extension.created || now,
        last_update: extension.modified || now,
        settings: extension.settings || defaultProjectSettings(),
        annotations
    }, extension.images || images)
}
