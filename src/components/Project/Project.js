import { Component } from "react";
import { Link, withRouter } from "react-router-dom";

// Import FontAwesome and icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFile, faFilePen, faHome } from "@fortawesome/free-solid-svg-icons";

// Import utils
import { checkIfProjectExists, createExportProjectJsonFile } from "../../Utils/utils";

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
import OneCardFullView from "../AdnoViewer/ViewerAnnotationCards/OneCardView/OneCardFullView";
import Navbar from "./Navbar/Navbar";

class Project extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annotations: JSON.parse(localStorage.getItem(`${this.props.match.params.id}_annotations`)) || [],
            selectedProject: JSON.parse(localStorage.getItem(this.props.match.params.id)) || {},
            editingMode: false,
            sidebarOpened: true,
            updateAnnotation: false,
            selectedAnnotation: {},
            showProjectMetadatas: false
        }
    }

    componentDidMount() {
        if (!checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        }
    }

    render() {
        return (
            <div className="project">

                <Navbar selectedProject={this.state.selectedProject} showProjectMetadatas={() => this.setState({ showProjectMetadatas: true })} editMode={this.props.editMode} />

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
                    this.state.showFullAnnotationView &&
                    <div className="text-rich">
                        <OneCardFullView fullAnnotation={this.state.selectedAnnotation} closeFullView={() => this.setState({ showFullAnnotationView: false })} />
                    </div>

                }


                {
                    this.state.annotations.length > 0 &&

                    <SidebarAnnotations
                        closeNav={() => {
                            this.setState({ sidebarOpened: false })
                        }
                        }
                        metadatasModal={this.state.showProjectMetadatas}
                        openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })}
                        openFullAnnotationView={(annotation) => this.setState({ showFullAnnotationView: true, selectedAnnotation: annotation })}
                        editingMode={this.props.editMode}
                        annotations={this.state.annotations}
                        updateAnnos={(updated_annos) => this.setState({ annotations: updated_annos })}
                        selectedProject={this.state.selectedProject}
                        updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                    />
                }



               


                <div className={this.state.annotations.length > 0 ? "adno-viewer-rightbar-without-annos" : "adno-viewer-rightbar-without-annos-sbclosed"}>
                    <div className="col">
                        <div className={this.state.sidebarOpened ? "right-card-opened" : "right-card-closed"}>
                            <div className="card">
                                {
                                    this.props.editMode ?
                                        <AdnoEditor
                                            annotations={this.state.annotations}
                                            updateAnnos={(annos) => this.setState({ annotations: annos })}
                                            openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })} />
                                        :
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