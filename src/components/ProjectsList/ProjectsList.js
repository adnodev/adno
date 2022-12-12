import { Component } from "react";
import ProjectView from "../ProjectView/ProjectView";

export default class ProjectsList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="projects_list">
                {
                    this.props.projects.map(project => {
                        return (<ProjectView key={project.id} project={project} />)
                    })
                }
            </div>
        )
    }
}