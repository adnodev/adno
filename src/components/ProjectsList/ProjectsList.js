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
                    this.props.projects
                        .filter(p => p)
                        .map(project => {
                            return (<ProjectView key={project.id} project={project} updateProjectsList={(projects) => this.props.updateProjects(projects)} />)
                        })
                }
            </div>
        )
    }
}