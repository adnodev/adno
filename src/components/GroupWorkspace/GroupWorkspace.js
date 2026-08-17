import { Component } from "react"

import { deriveGroups } from "../../Utils/groups"

import GroupPanel from "./GroupPanel"

import "./GroupWorkspace.css"

class GroupWorkspace extends Component {
    classes = () => ["group-workspace", this.props.variant, this.props.disposition, this.props.side]
        .filter(Boolean)
        .map((name, index) => index === 0 ? name : `group-workspace--${name}`)
        .join(" ")

    render() {
        const groups = deriveGroups(this.props.annotation)

        if (groups.length < 2) {
            return null
        }

        return (
            <div className={this.classes()}>
                {groups
                    .filter(group => group.id !== this.props.activeGroupId)
                    .map(group =>
                        <GroupPanel key={group.id}
                            elementId={`group-osd-${group.id}`}
                            project={this.props.project}
                            annotation={this.props.annotation}
                            group={group}
                            translate={this.props.translate} />
                    )}
            </div>
        )
    }
}

export default GroupWorkspace
