import { Component } from "react";
import { withRouter } from "react-router-dom";

// Import utils
import { checkIfProjectExists } from "../../Utils/utils";

// Import libraries
// import "../../libraries/annona-reworked/js/storyboard";
import "../../libraries/openseadragon/openseadragon-annotorious.min.js";

// Imports CSS
import "./Project.css";
import "./Sidebar.css";

// Import Components
import AdnoViewer from "../AdnoViewer/AdnoViewer";
import AdnoEditor from "../AdnoEditor/AdnoEditor";
import AdnoRichText from "../AdnoRichText/AdnoRichText";
import ProjectMetadatas from "./ProjectMetadatas/ProjectMetadatas";
import ProjectEditMetadatas from "./ProjectEditMetadatas/ProjectEditMetadatas";
import OneCardFullView from "../AdnoViewer/ViewerAnnotationCards/OneCardView/OneCardFullView";
import Navbar from "./Navbar/Navbar";
import OpenView from "../OpenView/OpenView";
import AnnotationCards from "../AdnoEditor/AnnotationCards/AnnotationCards";
import ViewerAnnotationCards from "../AdnoViewer/ViewerAnnotationCards/ViewerAnnotationCards";

class Project extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annotations: JSON.parse(localStorage.getItem(`${this.props.match.params.id}_annotations`)) || [],
            selectedProject: JSON.parse(localStorage.getItem(this.props.match.params.id)) || {},
            editingMode: false,
            sidebarOpened: true,
            updateAnnotation: false,
            showProjectMetadatas: false,
            selectedAnnotation: {}
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

                <Navbar selectedProject={this.state.selectedProject} showProjectMetadatas={() => this.setState({ showProjectMetadatas: true })} editMode={this.props.editMode} changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })} />

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
                        <AdnoRichText updateAnnos={(annos) => this.setState({ annotations: annos })} closeRichEditor={() => this.setState({ updateAnnotation: false })} selectedAnnotation={this.state.selectedAnnotation} selectedProjectId={this.props.match.params.id} annotations={this.state.annotations} changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })} />
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


                    <div className="sidebar-opened-w-modal">
                        {
                            this.props.editMode ?
                                <AnnotationCards
                                    updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                                    selectedProject={this.state.selectedProject}
                                    openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })}
                                    annotations={this.state.annotations}
                                    updateAnnos={(updated_annos) => this.setState({ annotations: updated_annos })}
                                    selectedAnno={this.state.selectedAnnotation}
                                    changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                                />
                                :
                                <ViewerAnnotationCards
                                    selectedAnno={this.state.selectedAnnotation}
                                    changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                                    editingMode={this.props.editMode}
                                    annotations={this.state.annotations}
                                    selectedProject={this.state.selectedProject}
                                    openFullAnnotationView={(annotation) => this.setState({ showFullAnnotationView: true, selectedAnnotation: annotation })}
                                />
                        }
                    </div>
                }

                <div className={this.state.annotations.length > 0 ? "adno-viewer-rightbar-without-annos" : "adno-viewer-rightbar-without-annos-sbclosed"}>
                    <div className="col">
                        <div className={this.state.sidebarOpened ? "right-card-opened" : "right-card-closed"}>
                            <div className="card">
                                {
                                    this.props.editMode ?
                                        <AdnoEditor
                                            annotations={this.state.annotations}
                                            updateAnnos={(updated_annos) => this.setState({ annotations: updated_annos })}
                                            selectedAnno={this.state.selectedAnnotation}
                                            openRichEditor={(annotation) => this.setState({ updateAnnotation: true, selectedAnnotation: annotation })}
                                            changeSelectedAnno={(anno) => this.setState({ selectedAnnotation: anno })}
                                        />
                                        :
                                        // <AdnoViewer updateAnnos={(annos) => this.setState({ annotations: annos })} />
                                        <OpenView
                                            annos={this.state.annotations}
                                            selectedAnno={this.state.selectedAnnotation}
                                            selected_project={this.state.selectedProject}
                                            changeSelectedAnno={(anno) => this.setState({ selectedAnnotation: anno })}
                                        />
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