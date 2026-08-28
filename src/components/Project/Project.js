import { useState, useEffect, useRef } from "react"
import { useParams, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next"
import { buildTagsList, defaultProjectSettings } from "../../Utils/utils";
import { ensureTargetGroups } from "../../Utils/groups"
import { exportToIIIF } from "../../services/iiif/exporter";
import { InfinitySpin } from 'react-loader-spinner'
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
import { SidebarControl } from "./SidebarControl"

import "./Project.css";
import "./Sidebar.css";

const Project = ({ editMode }) => {
    const { id } = useParams();
    const history = useHistory();
    const { t } = useTranslation()

    const viewerRef = useRef(null)

    const [state, setState] = useState({
        annotations: [],
        selectedProject: undefined,
        currentImageIndex: 0,
        pendingZone: null,
        sidebarOpened: true,
        sidebarMode: 'expanded',
        updateAnnotation: false,
        showProjectMetadatas: false,
        showSettings: false,
        settings: {},
        autoplayID: -1,
        audioContexts: [],
        past: [],
        future: [],
        selectedAnnotationId: null,
        selectedTargetIndex: 0,
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
                annotations: ensureTargetGroups(project.annotations),
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

    const selectAnnotation = (annotation, targetIndex = 0) => {
        setState(prev => ({
            ...prev,
            selectedAnnotationId: annotation ? annotation.id : null,
            selectedTargetIndex: targetIndex
        }))
    }

    const mdGuard = useRef(null)

    const guardLeavingEditor = (proceed) => {
        if (!mdGuard.current) {
            proceed()
            return
        }

        mdGuard.current().then(ok => ok && proceed())
    }

    const changeAnnoGuarded = (annotation, targetIndex = 0) => {
        if (!state.updateAnnotation || (annotation && annotation.id === state.selectedAnnotationId)) {
            selectAnnotation(annotation, targetIndex)
            return
        }

        guardLeavingEditor(() => setState(prev => ({
            ...prev,
            updateAnnotation: false,
            pendingZone: null,
            selectedAnnotationId: annotation ? annotation.id : null,
            selectedTargetIndex: targetIndex
        })))
    }

    const openRichEditor = (annotation) => {
        const open = () => setState(prev => ({
            ...prev,
            updateAnnotation: true,
            selectedAnnotationId: annotation.id,
            selectedTargetIndex: 0
        }))

        if (state.updateAnnotation && annotation.id !== state.selectedAnnotationId) {
            guardLeavingEditor(open)
            return
        }

        open()
    }

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

    const { annotations, settings } = state
    const selectedAnnotation = annotations.find(annotation => annotation.id === state.selectedAnnotationId) || null
    const settingsTags = settings.tags || [];
    const viewerAnnotations = settingsTags.length > 0
        ? annotations.filter(annotation => {
            const annotationTags = buildTagsList(annotation).map(v => v.value);
            return annotationTags.find(tag => settingsTags.includes(tag));
        })
        : annotations;

    if (!state.selectedProject)
        return <div className="loader">
            <InfinitySpin
                width='200'
                height="200"
                color="black"
            />
        </div>

    return (
        <div className="project">
            <Navbar
                settings={settings}
                selectedProject={state.selectedProject}
                showProjectMetadatas={() => setState(prev => ({ ...prev, showProjectMetadatas: true }))}
                editMode={editMode}
                changeSelectedAnno={(newSelectedAnno) => changeAnnoGuarded(newSelectedAnno)}
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
                <AdnoMdEditor
                    key={selectedAnnotation.id}
                    updateAnnos={(annos) => handleChanges({ annotations: annos })}
                    closeMdEditor={() => setState(prev => ({ ...prev, updateAnnotation: false, pendingZone: null }))}
                    registerGuard={(fn) => { mdGuard.current = fn }}
                    selectedAnnotation={selectedAnnotation}
                    selectedProjectId={id}
                    annotations={annotations}
                    changeSelectedAnno={selectAnnotation}
                    selectedTargetIndex={state.selectedTargetIndex}
                    startPendingZone={(annotationId, groupId) => setState(prev => ({ ...prev, pendingZone: { annotationId, groupId } }))}
                    getViewerRotation={() => viewerRef.current ? viewerRef.current.viewport.getRotation() : null}
                />
            )}

            {state.showFullAnnotationView && (
                <div className="text-rich">
                    <AdnoMdViewer
                        selectedAnnotation={selectedAnnotation}
                        closeFullView={() => setState(prev => ({ ...prev, showFullAnnotationView: false }))}
                    />
                </div>
            )}

            <div className="flex h-full">
                {annotations.length > 0 && editMode && (
                    <div className="sidebar-opened-w-modal">
                        <AnnotationCards
                            updateProject={(updatedProject) => setState(prev => ({ ...prev, selectedProject: updatedProject }))}
                            selectedProject={state.selectedProject}
                            openRichEditor={openRichEditor}
                            annotations={annotations}
                            updateAnnos={(updated_annos) => handleChanges({ annotations: updated_annos })}
                            selectedAnno={selectedAnnotation}
                            changeSelectedAnno={(newSelectedAnno) => changeAnnoGuarded(newSelectedAnno)}
                            pendingZone={state.pendingZone}
                            startPendingZone={(annotationId, groupId) => setState(prev => ({ ...prev, pendingZone: { annotationId, groupId } }))}
                        />
                    </div>
                )}

                {annotations.length > 0 && !editMode && settings.sidebarEnabled && (
                    <div className={`sidebar-opened-w-modal sidebar--${state.sidebarMode}`}>
                        <SidebarControl
                            mode={state.sidebarMode}
                            setMode={(sidebarMode) => setState(prev => ({ ...prev, sidebarMode }))}
                            translate={t}
                        />
                        <ViewerAnnotationCards
                            updateProject={(updatedProject) => setState(prev => ({ ...prev, selectedProject: updatedProject }))}
                            selectedProject={state.selectedProject}
                            annotations={viewerAnnotations}
                            selectedAnno={selectedAnnotation}
                            changeSelectedAnno={(newSelectedAnno) => selectAnnotation(newSelectedAnno)}
                            editingMode={editMode}
                            contentPosition={settings.contentPosition}
                            openFullAnnotationView={(annotation) => setState(prev => ({
                                ...prev,
                                showFullAnnotationView: true,
                                selectedAnnotationId: annotation.id,
                                selectedTargetIndex: 0
                            }))}
                        />
                    </div>
                )}

                {editMode ? (
                    <AdnoEditor
                        selectedProject={state.selectedProject}
                        currentImageIndex={state.currentImageIndex}
                        changeImage={(index) => setState(prev => ({ ...prev, currentImageIndex: index }))}
                        pendingZone={state.pendingZone}
                        endPendingZone={() => setState(prev => ({ ...prev, pendingZone: null }))}
                        editingAnnotation={state.updateAnnotation}
                        annotations={annotations}
                        updateAnnos={(updated_annos) => handleChanges({ annotations: updated_annos })}
                        selectedAnno={selectedAnnotation}
                        selectedTargetIndex={state.selectedTargetIndex}
                        changeSelectedAnno={changeAnnoGuarded}
                        rotation={settings.rotation}
                        defaultRotation={settings.defaultRotation}
                        rotationTransition={settings.rotationTransition}
                        showNavigator={settings.showNavigator}
                        onViewerReady={(viewer) => { viewerRef.current = viewer }}
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
                        defaultRotation={settings.defaultRotation}
                        rotationTransition={settings.rotationTransition}
                        timerDelay={settings.delay}
                        showOutlines={settings.showOutlines}
                        showCurrentAnnotation={settings.showCurrentAnnotation}
                        soundMode={settings.soundMode}
                        spatialization={settings.spatialization}
                        showEyes={settings.showEyes}
                        contentPosition={settings.contentPosition}
                        multiviewDisposition={settings.multiviewDisposition}
                        annos={viewerAnnotations}
                        selectedAnno={selectedAnnotation}
                        selectedTargetIndex={state.selectedTargetIndex}
                        selectedProject={state.selectedProject}
                        changeSelectedAnno={selectAnnotation}
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
    );
};

export default Project;