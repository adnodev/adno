import { Component } from "react";
import { Link, withRouter } from "react-router-dom";

// Import FontAwesome and icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFile, faFilePen, faHome } from "@fortawesome/free-solid-svg-icons";

// Import utils
import { checkIfProjectExists, createExportProjectJsonFile } from "../../../Utils/utils";

// Import libraries
import "../../libraries/annona-reworked/js/storyboard";
import "../../libraries/openseadragon/openseadragon.min.js";

// Imports CSS
import "./Project.css";

// Import Components
import AdnoViewer from "../AdnoViewer/AdnoViewer";
import AdnoEditor from "../AdnoEditor/AdnoEditor";
import SidebarAnnotations from "../SidebarAnnotations/SidebarAnnotations";
import AdnoRichText from "../AdnoRichText/AdnoRichText";
import ProjectMetadatas from "./ProjectMetadatas/ProjectMetadatas";
import ProjectEditMetadatas from "./ProjectEditMetadatas/ProjectEditMetadatas";

class Project extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annotations: JSON.parse(localStorage.getItem(`${this.props.match.params.id}_annotations`)) || [],
            selectedProject: JSON.parse(localStorage.getItem(this.props.match.params.id)),
            editingMode: false,
            sidebarOpened: true,
            updateAnnotation: false,
            selectedAnnotation: {},
            showProjectMetadatas: false
        }
    }

    componentDidMount() {
        console.log(this.props.editMode);
        if (!checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        }
    }

    render() {
        return (
            <div className={this.state.annotations.length > 0 ? "adno-project-view-sb-opened" : "adno-project-view"}>

                {
                    this.state.showProjectMetadatas && this.props.editMode ?
                        <ProjectEditMetadatas updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })} selectedProject={this.state.selectedProject} closeProjectMetadatas={() => this.setState({ showProjectMetadatas: false })} />
                        :
                        this.state.showProjectMetadatas && !this.props.editMode &&
                        <ProjectMetadatas selectedProject={this.state.selectedProject} closeProjectMetadatas={() => this.setState({ showProjectMetadatas: false })} />
                }


                {
                    this.state.updateAnnotation &&
                    <div className="text-rich">
                        <AdnoRichText updateAnnos={(annos) => this.setState({ annotations: annos })} closeRichEditor={() => this.setState({ updateAnnotation: false })} selectedAnnotation={this.state.selectedAnnotation} selectedProjectId={this.props.match.params.id} annotations={this.state.annotations} />
                    </div>
                }


                {
                    this.state.annotations.length > 0 &&

                    <SidebarAnnotations
                        sidebarStatus={this.state.sidebarOpened}
                        closeNav={() => {
                            this.setState({ sidebarOpened: false })
                        }
                        }
                        metadatasModal={this.state.showProjectMetadatas}
                        openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })}
                        editingMode={this.props.editMode}
                        annotations={this.state.annotations}
                        updateAnnos={(updated_annos) => this.setState({ annotations: updated_annos })}
                        selectedProject={this.state.selectedProject}
                        updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                    />
                }



                <div className="navbar bg-neutral text-neutral-content">

                    <Link to={"/"} className="btn btn-ghost normal-case"> <FontAwesomeIcon icon={faHome} /> </Link>
                    {
                        this.state.selectedProject.id &&
                        <a id={"download_btn_" + this.state.selectedProject.id} href={createExportProjectJsonFile(this.state.selectedProject.id)} download={this.state.selectedProject.title + ".json"} className="btn btn-md"> <FontAwesomeIcon icon={faDownload} /> </a>
                    }

                    <button onClick={() => this.setState({ showProjectMetadatas: true })} className="btn btn-md"><FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} /></button>


                    <p>{this.state.selectedProject.title} {this.state.selectedProject.autor && `(${this.state.selectedProject.autor})`} </p>

                    {
                        process.env.ADNO_MODE === "FULL" &&
                        <div className="dl_toggle">


                            <label className="cursor-pointer label label-toggle">
                                <label>Mode édition</label>
                                <input type="checkbox" className="toggle toggle-lg toggle-success" value={this.props.editMode}
                                    onChange={() => {
                                        if (this.props.editMode) {
                                            this.props.history.push(`/project/${this.props.match.params.id}/view`)
                                        } else {
                                            this.props.history.push(`/project/${this.props.match.params.id}/edit`)
                                        }
                                    }
                                    }
                                    checked={this.props.editMode} />
                            </label>


                        </div>
                    }

                </div>


                <div className={this.state.annotations.length > 0 ? "adno-viewer-rightbar-without-annos" : "adno-viewer-rightbar-without-annos-sbclosed"}>
                    <div className="col">
                        <div className={this.state.sidebarOpened ? "right-card-opened" : "right-card-closed"}>
                            <div className="card">
                                {
                                    !this.state.updateAnnotation
                                        && this.props.editMode ?
                                        <AdnoEditor showMetadatas={this.state.showProjectMetadatas} updateAnnos={(annos) => this.setState({ annotations: annos })} openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })} closeNav={() => {
                                            this.setState({ sidebarOpened: false })
                                        }} />
                                        : !this.state.updateAnnotation  && !this.props.editMode &&
                                        <AdnoViewer updateAnnos={(annos) => this.setState({ annotations: annos })} />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(Project)