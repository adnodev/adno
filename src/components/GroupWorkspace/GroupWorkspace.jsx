import { deriveGroups } from "../../Utils/groups"
import { cutoutGroupIds } from "../../Utils/cutout"

import GroupPanel from "./GroupPanel"

import "./GroupWorkspace.css"

export function panelGroups(annotation, activeGroupId) {
    const cutouts = cutoutGroupIds(annotation)

    return deriveGroups(annotation)
        .filter(group => group.id !== activeGroupId && !cutouts.includes(group.id))
}

export function panelEntries(annotation, activeGroupId, areaNames) {
    return panelGroups(annotation, activeGroupId)
        .map((group, index) => ({ group, area: areaNames[index] }))
        .filter(entry => entry.area)
}

export function GroupWorkspace({ project, annotation, activeGroupId, areaNames, crossOriginPolicy, defaultRotation, transition, outlinesVisible, styles }) {
    return panelEntries(annotation, activeGroupId, areaNames)
        .map(({ group, area }) =>
            <GroupPanel key={group.id}
                elementId={`group-osd-${group.id}`}
                project={project}
                annotation={annotation}
                group={group}
                area={area}
                crossOriginPolicy={crossOriginPolicy}
                defaultRotation={defaultRotation}
                transition={transition}
                outlinesVisible={outlinesVisible}
                styles={styles} />
        )
}
