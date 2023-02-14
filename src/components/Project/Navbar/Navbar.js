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
            <div className="navbar text-neutral-content">
                <Link to={"/"} className="project-navbar-link project-page-title" title="Retourner à l'accueil"> 
                    <h1>ADNO</h1>
                </Link>
                <Link to={"/"} className="project-navbar-link" title="Retourner à l'accueil"> <FontAwesomeIcon icon={faHome} size="lg"/> </Link>

                {
                    this.props.selectedProject && this.props.selectedProject.id &&
                    <a id={"download_btn_" + this.props.selectedProject.id} href={createExportProjectJsonFile(this.props.selectedProject.id)} download={this.props.selectedProject.title + ".json"} className="project-navbar-link" title="Télécharger le projet"> <FontAwesomeIcon icon={faDownload} size="lg"/> </a>
                }

                <button onClick={() => this.props.showProjectMetadatas()} className="project-navbar-link" title="Modifier le projet"><FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} size="lg"/></button>


                <p>Nom du projet :&nbsp;<strong>{this.props.selectedProject.title} {this.props.selectedProject.autor && `(${this.props.selectedProject.autor})`}</strong></p>

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