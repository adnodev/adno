import { deriveGroups } from "../../Utils/groups"

import GroupPanel from "./GroupPanel"

import "./GroupWorkspace.css"

export function GroupWorkspace({ project, annotation, activeGroupId, areaNames, crossOriginPolicy, defaultRotation, styles }) {
    return deriveGroups(annotation)
        .filter(group => group.id !== activeGroupId)
        .map((group, index) => ({ group, area: areaNames[index] }))
        .filter(entry => entry.area)
        .map(({ group, area }) =>
            <GroupPanel key={group.id}
                elementId={`group-osd-${group.id}`}
                project={project}
                annotation={annotation}
                group={group}
                area={area}
                crossOriginPolicy={crossOriginPolicy}
                defaultRotation={defaultRotation}
                styles={styles} />
        )
}
