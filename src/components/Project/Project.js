import { Component } from "react";
import { withRouter } from "react-router-dom";

// Import utils
import { buildTagsList, checkIfProjectExists, getProjectSettings } from "../../Utils/utils";

// Import libraries
// import "/libraries/openseadragon/openseadragon-annotorious.min.js";

// Imports CSS
import "./Project.css";
import "./Sidebar.css";

// Import Components
import AdnoEditor from "../AdnoEditor/AdnoEditor";
import ProjectMetadatas from "./ProjectMetadatas/ProjectMetadatas";
import ProjectEditMetadatas from "./ProjectEditMetadatas/ProjectEditMetadatas";
import Navbar from "./Navbar/Navbar";
import OpenView from "../OpenView/OpenView";
import AnnotationCards from "../AdnoEditor/AnnotationCards/AnnotationCards";
import ViewerAnnotationCards from "../AdnoViewer/ViewerAnnotationCards/ViewerAnnotationCards";
import ProjectSettings from "./ProjectSettings";
import AdnoMdEditor from "../AdnoMarkdown/AdnoMdEditor";
import AdnoMdViewer from "../AdnoMarkdown/AdnoMdViewer";
import { exportToIIIF } from "../../services/iiif/exporter";

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
            showSettings: false,
            settings: getProjectSettings(this.props.match.params.id),
            autoplayID: -1,

            audioContexts: [],

            past: [],
            future: []
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.editMode !== this.props.editMode) {
            this.state.audioContexts.forEach(r => r.suspend())
        }
    }

    componentDidMount() {
        if (!checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        }
    }

    readTagsUserPreferences = () => {
        const userPreferences = (JSON.parse(localStorage.getItem(this.props.match.params.id)) || {}).user_preferences

        let tags = []
        if (userPreferences)
            tags = userPreferences.tags.map(tag => ({ value: tag, label: tag }))

        return tags
    }

    updateSettings = (newSettings) => {
        // Update the state
        this.setState({ settings: newSettings })

        let project = { ...this.state.selectedProject }
        project.settings = { ...newSettings }

        // Update the localStorage item
        localStorage.setItem(this.state.selectedProject.id, JSON.stringify(project))
    }

    handleChanges = (arr) => {
        this.setState(prevState => {
            const { past, future, ...state } = prevState
            const newState = Object.entries(arr)
                .reduce((acc, item) => {
                    const [key, value] = item
                    return {
                        ...acc,
                        [key]: value
                    }
                }, state);

            const updatedPast = [...past, state].slice(-3)

            return {
                ...newState,
                past: updatedPast,
                future: []
            }
        })
    }

    render() {
        const { annotations, settings } = this.state;

        const settingsTags = settings.tags || [];
        const viewerAnnotations = settingsTags.length > 0 ? annotations.filter(annotation => {
            const annotationTags = buildTagsList(annotation).map(v => v.value);
            return annotationTags.find(tag => settingsTags.includes(tag))
        }) : annotations;

        return (
            <div className="project">

                <Navbar
                    settings={this.state.settings}
                    selectedProject={this.state.selectedProject}
                    showProjectMetadatas={() => this.setState({ showProjectMetadatas: true })}
                    editMode={this.props.editMode}
                    changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                    showEditorSettings={() => this.setState({ showSettings: true })}
                    autoplayID={this.state.autoplayID}
                    exportIIIF={() => exportToIIIF(this.state)}
                    undoRedo={{
                        undo: () => {
                            this.setState((prevState) => {
                                const { past, future, ...present } = prevState;

                                if (past.length === 0) return null; // No undo available

                                const previousState = past[past.length - 1];
                                const updatedPast = past.slice(0, -1);

                                return {
                                    past: updatedPast,
                                    future: [present, ...future],
                                    ...previousState
                                };
                            });
                        },
                        redo: () => {
                            this.setState((prevState) => {
                                const { past, future, ...present } = prevState;

                                if (future.length === 0) return null; // No redo available

                                const nextState = future[0];
                                const updatedFuture = future.slice(1);

                                return {
                                    past: [...past, present].slice(-3), // Add current state to past (limit to 3)
                                    future: updatedFuture,
                                    ...nextState
                                };
                            });
                        },
                        canUndo: this.state.past.length !== 0,
                        canRedo: this.state.future.length !== 0,
                    }}
                />

                {
                    this.state.showProjectMetadatas && this.props.editMode ?
                        <ProjectEditMetadatas
                            updateProject={(updatedProject) => this.setState({
                                selectedProject: updatedProject,
                                showProjectMetadatas: false
                            })}
                            selectedProject={this.state.selectedProject}
                            closeProjectMetadatas={() => this.setState({ showProjectMetadatas: false })} />
                        :
                        this.state.showProjectMetadatas && !this.props.editMode &&
                        <ProjectMetadatas
                            selectedProject={this.state.selectedProject}
                            closeProjectMetadatas={() => this.setState({ showProjectMetadatas: false })} />
                }

                {
                    this.state.showSettings && !this.props.editMode &&
                    <ProjectSettings
                        settings={this.state.settings}
                        updateSettings={(newSettings) => this.updateSettings(newSettings)}
                        closeSettings={() => this.setState({ showSettings: false })}
                        annotations={this.state.annotations}
                    />
                }


                {
                    this.state.updateAnnotation && this.state.selectedAnnotation &&
                    <div className="text-rich">
                        <AdnoMdEditor
                            updateAnnos={(annos) => this.handleChanges({ annotations: annos })}
                            closeMdEditor={() => this.setState({ updateAnnotation: false })}
                            selectedAnnotation={this.state.selectedAnnotation}
                            selectedProjectId={this.props.match.params.id}
                            annotations={this.state.annotations}
                            changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                        />
                    </div>
                }

                {
                    // Display annotation's markdown
                    this.state.showFullAnnotationView &&
                    <div className="text-rich">
                        <AdnoMdViewer
                            selectedAnnotation={this.state.selectedAnnotation}
                            closeFullView={() => this.setState({ showFullAnnotationView: false })}
                        />
                    </div>
                }


                {
                    this.state.annotations.length > 0 && this.props.editMode ?
                        <div className="sidebar-opened-w-modal">
                            {
                                <AnnotationCards
                                    updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                                    selectedProject={this.state.selectedProject}
                                    openRichEditor={(annotation) => {
                                        this.setState({ updateAnnotation: true, selectedAnnotation: annotation })
                                    }}
                                    annotations={this.state.annotations}
                                    updateAnnos={(updated_annos) => this.handleChanges({ annotations: updated_annos })}
                                    selectedAnno={this.state.selectedAnnotation}
                                    changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                                />
                            }
                        </div>
                        :
                        this.state.annotations.length > 0 && !this.props.editMode && this.state.settings.sidebarEnabled &&
                        <div className="sidebar-opened-w-modal">
                            {
                                this.props.editMode ?
                                    <AnnotationCards
                                        updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                                        selectedProject={this.state.selectedProject}
                                        openRichEditor={(annotation) => {
                                            this.setState({ updateAnnotation: true, selectedAnnotation: annotation })
                                        }}
                                        annotations={this.state.annotations}
                                        updateAnnos={(updated_annos) => this.handleChanges({ annotations: updated_annos })}
                                        selectedAnno={this.state.selectedAnnotation}
                                        changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                                    />
                                    :
                                    <ViewerAnnotationCards
                                        updateProject={(updatedProject) => this.setState({ selectedProject: updatedProject })}
                                        selectedProject={this.state.selectedProject}
                                        annotations={viewerAnnotations}
                                        selectedAnno={this.state.selectedAnnotation}
                                        changeSelectedAnno={(newSelectedAnno) => this.setState({ selectedAnnotation: newSelectedAnno })}
                                        editingMode={this.props.editMode}
                                        openFullAnnotationView={(annotation) => {
                                            this.setState({ showFullAnnotationView: true, selectedAnnotation: annotation })
                                        }}
                                    />
                            }
                        </div>
                }

                <div className={this.state.annotations.length > 0 && this.state.settings.sidebarEnabled ? "adno-viewer-rightbar-with-annos" : ""}>
                    <div className="col">
                        <div className="card">
                            {
                                this.props.editMode ?
                                    <AdnoEditor
                                        annotations={this.state.annotations}
                                        updateAnnos={(updated_annos) => this.handleChanges({ annotations: updated_annos })}
                                        selectedAnno={this.state.selectedAnnotation}
                                        openRichEditor={(annotation) => {
                                            this.setState({ updateAnnotation: true, selectedAnnotation: annotation })
                                        }}
                                        changeSelectedAnno={(anno) => this.setState({ selectedAnnotation: anno })}
                                        rotation={this.state.settings.rotation}
                                    />
                                    :
                                    <OpenView
                                        setAudioContexts={audioContexts => this.setState({ audioContexts })}
                                        startbyfirstanno={this.state.settings.startbyfirstanno}
                                        shouldAutoPlayAnnotations={this.state.settings.shouldAutoPlayAnnotations}
                                        showNavigator={this.state.settings.showNavigator}
                                        toolsbarOnFs={this.state.settings.toolsbarOnFs}
                                        showToolbar={this.state.settings.displayToolbar}
                                        rotation={this.state.settings.rotation}
                                        timerDelay={this.state.settings.delay}
                                        showOutlines={this.state.settings.showOutlines}
                                        showCurrentAnnotation={this.state.settings.showCurrentAnnotation}
                                        soundMode={this.state.settings.soundMode}
                                        spatialization={this.state.settings.spatialization}
                                        showEyes={this.state.settings.showEyes}
                                        annos={viewerAnnotations}
                                        selectedAnno={this.state.selectedAnnotation}
                                        selected_project={this.state.selectedProject}
                                        changeSelectedAnno={(anno) => this.setState({ selectedAnnotation: anno })}
                                        updateAutoplayId={(id) => this.setState({ autoplayID: id })}
                                        changeShowToolbar={(newState) => this.setState({ settings: { ...this.state.settings, displayToolbar: !this.state.settings.displayToolbar } })}
                                        outlineWidth={this.state.settings.outlineWidth}
                                        outlineColor={this.state.settings.outlineColor}
                                        outlineColorFocus={this.state.settings.outlineColorFocus}
                                    />
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(Project)
