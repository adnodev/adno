import { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { buildTagsList, defaultProjectSettings } from "../../Utils/utils";
import { exportToIIIF } from "../../services/iiif/exporter";
import { projectDB } from "../../services/db";

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

import "./Project.css";
import "./Sidebar.css";

const Project = ({ editMode }) => {
    const { id } = useParams();
    const history = useHistory();

    const [state, setState] = useState({
        annotations: [],
        selectedProject: {},
        sidebarOpened: true,
        updateAnnotation: false,
        showProjectMetadatas: false,
        showSettings: false,
        settings: {},
        autoplayID: -1,
        audioContexts: [],
        past: [],
        future: [],
        selectedAnnotation: null,
        showFullAnnotationView: false
    });

    useEffect(() => {
        const loadProject = async () => {
            const project = await projectDB.exists(id);
            if (!project) {
                history.push("/");
                return;
            }
            setState(prev => ({
                ...prev,
                selectedProject: project,
                annotations: project.annotations,
                settings: project.settings || defaultProjectSettings()
            }));
        };

        loadProject();
    }, [id, history]);

    useEffect(() => {
        if (editMode) {
            state.audioContexts.forEach(r => r.suspend());
        }
    }, [editMode, state.audioContexts]);

    const updateSettings = async (newSettings) => {
        setState(prev => ({ ...prev, settings: newSettings }));
        await projectDB.update(id, { settings: newSettings });
    };

    const handleChanges = (arr) => {
        setState(prevState => {
            const { past, future, ...state } = prevState;
            const newState = Object.entries(arr).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: value
            }), state);

            const updatedPast = [...past, state].slice(-3);

            return {
                ...newState,
                past: updatedPast,
                future: []
            };
        });
    };

    const undo = () => {
        setState(prevState => {
            const { past, future, ...present } = prevState;
            if (past.length === 0) return prevState;

            const previousState = past[past.length - 1];
            const updatedPast = past.slice(0, -1);

            return {
                past: updatedPast,
                future: [present, ...future],
                ...previousState
            };
        });
    };

    const redo = () => {
        setState(prevState => {
            const { past, future, ...present } = prevState;
            if (future.length === 0) return prevState;

            const nextState = future[0];
            const updatedFuture = future.slice(1);

            return {
                past: [...past, present].slice(-3),
                future: updatedFuture,
                ...nextState
            };
        });
    };

    const { annotations, settings, selectedAnnotation } = state;
    const settingsTags = settings.tags || [];
    const viewerAnnotations = settingsTags.length > 0
        ? annotations.filter(annotation => {
            const annotationTags = buildTagsList(annotation).map(v => v.value);
            return annotationTags.find(tag => settingsTags.includes(tag));
        })
        : annotations;

    console.log(state)

    return (
        <div className="project">
            <Navbar
                settings={settings}
                selectedProject={state.selectedProject}
                showProjectMetadatas={() => setState(prev => ({ ...prev, showProjectMetadatas: true }))}
                editMode={editMode}
                changeSelectedAnno={(newSelectedAnno) => setState(prev => ({ ...prev, selectedAnnotation: newSelectedAnno }))}
                showEditorSettings={() => setState(prev => ({ ...prev, showSettings: true }))}
                autoplayID={state.autoplayID}
                exportIIIF={() => exportToIIIF(state)}
                undoRedo={{
                    undo,
                    redo,
                    canUndo: state.past.length !== 0,
                    canRedo: state.future.length !== 0,
                }}
            />

            {state.showProjectMetadatas && editMode && (
                <ProjectEditMetadatas
                    updateProject={(updatedProject) => setState(prev => ({
                        ...prev,
                        selectedProject: updatedProject,
                        showProjectMetadatas: false
                    }))}
                    selectedProject={state.selectedProject}
                    closeProjectMetadatas={() => setState(prev => ({ ...prev, showProjectMetadatas: false }))}
                />
            )}

            {state.showProjectMetadatas && !editMode && (
                <ProjectMetadatas
                    selectedProject={state.selectedProject}
                    closeProjectMetadatas={() => setState(prev => ({ ...prev, showProjectMetadatas: false }))}
                />
            )}

            {state.showSettings && !editMode && (
                <ProjectSettings
                    settings={settings}
                    updateSettings={updateSettings}
                    closeSettings={() => setState(prev => ({ ...prev, showSettings: false }))}
                    annotations={annotations}
                />
            )}

            {state.updateAnnotation && selectedAnnotation && (
                <div className="text-rich">
                    <AdnoMdEditor
                        updateAnnos={(annos) => handleChanges({ annotations: annos })}
                        closeMdEditor={() => setState(prev => ({ ...prev, updateAnnotation: false }))}
                        selectedAnnotation={selectedAnnotation}
                        selectedProjectId={id}
                        annotations={annotations}
                        changeSelectedAnno={(newSelectedAnno) => setState(prev => ({ ...prev, selectedAnnotation: newSelectedAnno }))}
                    />
                </div>
            )}

            {state.showFullAnnotationView && (
                <div className="text-rich">
                    <AdnoMdViewer
                        selectedAnnotation={selectedAnnotation}
                        closeFullView={() => setState(prev => ({ ...prev, showFullAnnotationView: false }))}
                    />
                </div>
            )}

            {annotations.length > 0 && editMode && (
                <div className="sidebar-opened-w-modal">
                    <AnnotationCards
                        updateProject={(updatedProject) => setState(prev => ({ ...prev, selectedProject: updatedProject }))}
                        selectedProject={state.selectedProject}
                        openRichEditor={(annotation) => setState(prev => ({
                            ...prev,
                            updateAnnotation: true,
                            selectedAnnotation: annotation
                        }))}
                        annotations={annotations}
                        updateAnnos={(updated_annos) => handleChanges({ annotations: updated_annos })}
                        selectedAnno={selectedAnnotation}
                        changeSelectedAnno={(newSelectedAnno) => setState(prev => ({ ...prev, selectedAnnotation: newSelectedAnno }))}
                    />
                </div>
            )}

            {annotations.length > 0 && !editMode && settings.sidebarEnabled && (
                <div className="sidebar-opened-w-modal">
                    <ViewerAnnotationCards
                        updateProject={(updatedProject) => setState(prev => ({ ...prev, selectedProject: updatedProject }))}
                        selectedProject={state.selectedProject}
                        annotations={viewerAnnotations}
                        selectedAnno={selectedAnnotation}
                        changeSelectedAnno={(newSelectedAnno) => setState(prev => ({ ...prev, selectedAnnotation: newSelectedAnno }))}
                        editingMode={editMode}
                        openFullAnnotationView={(annotation) => setState(prev => ({
                            ...prev,
                            showFullAnnotationView: true,
                            selectedAnnotation: annotation
                        }))}
                    />
                </div>
            )}

            <div className={annotations.length > 0 && settings.sidebarEnabled ? "adno-viewer-rightbar-with-annos" : ""}>
                <div className="col">
                    <div className="card">
                        {editMode ? (
                            <AdnoEditor
                                annotations={annotations}
                                updateAnnos={(updated_annos) => handleChanges({ annotations: updated_annos })}
                                selectedAnno={selectedAnnotation}
                                openRichEditor={(annotation) => setState(prev => ({
                                    ...prev,
                                    updateAnnotation: true,
                                    selectedAnnotation: annotation
                                }))}
                                changeSelectedAnno={(anno) => setState(prev => ({ ...prev, selectedAnnotation: anno }))}
                                rotation={settings.rotation}
                            />
                        ) : (
                            <OpenView
                                setAudioContexts={audioContexts => setState(prev => ({ ...prev, audioContexts }))}
                                startbyfirstanno={settings.startbyfirstanno}
                                shouldAutoPlayAnnotations={settings.shouldAutoPlayAnnotations}
                                showNavigator={settings.showNavigator}
                                toolsbarOnFs={settings.toolsbarOnFs}
                                showToolbar={settings.displayToolbar}
                                rotation={settings.rotation}
                                timerDelay={settings.delay}
                                showOutlines={settings.showOutlines}
                                showCurrentAnnotation={settings.showCurrentAnnotation}
                                soundMode={settings.soundMode}
                                spatialization={settings.spatialization}
                                showEyes={settings.showEyes}
                                annos={viewerAnnotations}
                                selectedAnno={selectedAnnotation}
                                selected_project={state.selectedProject}
                                changeSelectedAnno={(anno) => setState(prev => ({ ...prev, selectedAnnotation: anno }))}
                                updateAutoplayId={(id) => setState(prev => ({ ...prev, autoplayID: id }))}
                                changeShowToolbar={() => setState(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, displayToolbar: !prev.settings.displayToolbar }
                                }))}
                                outlineWidth={settings.outlineWidth}
                                outlineColor={settings.outlineColor}
                                outlineColorFocus={settings.outlineColorFocus}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Project;