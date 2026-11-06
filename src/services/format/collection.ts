import type { Project } from "../../Utils/project"
import { exportAnnotation } from "./annotation"
import { wadmContext } from "./context"
import { adnoProjectForWADM, GENERATOR } from "./extension"
import { collectionId, collectionPageId, projectRoot } from "./ids"
import { ADNO_PROJECT, type ExportOptions, type JsonObject } from "./model"

function creatorAgent(creator: string): JsonObject {
    return {
        type: 'Person',
        name: creator
    }
}

export function toWADMCollection(project: Project, options: ExportOptions): JsonObject {
    const root = projectRoot(options.base, project.id)
    const annotations = project.annotations || []

    return {
        '@context': wadmContext(),
        id: collectionId(root),
        type: 'AnnotationCollection',
        label: project.title,
        ...(project.creator ? { creator: creatorAgent(project.creator) } : {}),
        created: project.creation_date,
        modified: project.last_update,
        generator: GENERATOR,
        total: annotations.length,
        first: {
            id: collectionPageId(root),
            type: 'AnnotationPage',
            startIndex: 0,
            items: annotations.map(annotation => exportAnnotation(annotation, root, zone => zone))
        },
        [ADNO_PROJECT]: adnoProjectForWADM(project)
    }
}
