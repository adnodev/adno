import { deriveGroups } from "../../Utils/groups"

import GroupPanel from "./GroupPanel"

import "./GroupWorkspace.css"

function workspaceClasses(variant, disposition, side) {
    return ["group-workspace", variant, disposition, side]
        .filter(Boolean)
        .map((name, index) => index === 0 ? name : `group-workspace--${name}`)
        .join(" ")
}

export function GroupWorkspace({ project, annotation, activeGroupId, variant, disposition, side, translate }) {
    const groups = deriveGroups(annotation)

    if (groups.length < 2) {
        return null
    }

    return (
        <div className={workspaceClasses(variant, disposition, side)}>
            {groups
                .filter(group => group.id !== activeGroupId)
                .map(group =>
                    <GroupPanel key={group.id}
                        elementId={`group-osd-${group.id}`}
                        project={project}
                        annotation={annotation}
                        group={group}
                        translate={translate} />
                )}
        </div>
    )
}
