import { faDownload, faFile, faFilePen, faGear, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { createExportProjectJsonFile } from "../../../Utils/utils";

class Navbar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="navbar bg-neutral text-neutral-content">

                <Link to={"/"} className="btn btn-ghost normal-case"> <FontAwesomeIcon icon={faHome} size="lg"/> </Link>

                {
                    this.props.selectedProject && this.props.selectedProject.id &&
                    <a id={"download_btn_" + this.props.selectedProject.id} href={createExportProjectJsonFile(this.props.selectedProject.id)} download={this.props.selectedProject.title + ".json"} className="btn btn-md"> <FontAwesomeIcon icon={faDownload} size="lg"/> </a>
                }

                <button onClick={() => this.props.showProjectMetadatas()} className="btn btn-md"><FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} size="lg"/></button>


                <p>{this.props.selectedProject.title} {this.props.selectedProject.autor && `(${this.props.selectedProject.autor})`} </p>

                {
                    process.env.ADNO_MODE === "FULL" &&
                    <div className="dl_toggle">

                        {
                            !this.props.editMode &&
                            <button onClick={() => this.props.showEditorSettings()} className="btn btn-md"><FontAwesomeIcon icon={faGear} size="lg"/></button>
                        }


                        <label className="cursor-pointer label label-toggle">
                            <label>Mode édition</label>
                            <input type="checkbox" className="toggle toggle-lg toggle-success" value={this.props.editMode}
                                onChange={() => {
                                    if (this.props.editMode) {
                                        // Unselect current annotation when switching page
                                        this.props.changeSelectedAnno(undefined)
                                        this.props.history.push(`/project/${this.props.match.params.id}/view`)
                                    } else {
                                        // Unselect current annotation when switching page
                                        this.props.changeSelectedAnno(undefined)
                                        this.props.history.push(`/project/${this.props.match.params.id}/edit`)
                                    }
                                }
                                }
                                checked={this.props.editMode} />
                        </label>


                    </div>
                }

            </div>
        )
    }
}

export default withRouter(Navbar);