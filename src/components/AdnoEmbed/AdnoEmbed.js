import { Component } from "react";
import { withRouter } from "react-router";
import { withTranslation } from "react-i18next"
import { InfinitySpin } from 'react-loader-spinner'
import { buildJsonProjectWithImg, buildTagsList, enhancedFetch } from "../../Utils/utils"
import { fromAny } from "../../services/format"
import { toast } from "../Toast/store"
import OpenView from "../OpenView/OpenView"

import "./AdnoEmbed.css";

const EMBED_ID = 'adno-embed'

const JSON_CONTENT_TYPES = ['application/json', 'text/html', 'text/plain', 'application/octet-stream',
    'application/vnd.api+json', 'application/ld+json', 'application/x-json-stream', 'text/json']

function annotationsTagged(annotations, selectedTags) {
    if (selectedTags.length === 0) {
        return annotations
    }

    return annotations
        .map(annotation => ({
            ...annotation,
            tags: buildTagsList(annotation).map(tag => tag.value)
        }))
        .filter(annotation => annotation.tags.find(tag => selectedTags.includes(tag)))
}

class AdnoEmbed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annos: [],
            selectedAnno: null,
            selectedTargetIndex: 0,
            source: null,
            isLoaded: false,
            settingsReady: false,
            soundMode: 'no_sound'
        };
    }

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search)

        this.getAdnoProject(query.get("url"))
    }

    overrideSettings = () => {
        const query = new URLSearchParams(this.props.location.search);

        const checkQueryParamValue = (name, stateField, defaultValue) => {
            const value = query.has(name) ? query.get(name)
                : this.state[stateField] ? this.state[stateField] : defaultValue;

            if (value === 'false')
                return false
            if (value === 'true')
                return true

            return value
        }

        let delay = checkQueryParamValue("delay", "delay", 3)

        if (delay < 1 || delay > 20)
            delay = 3

        const showNavigator = checkQueryParamValue("navigator", "showNavigator", true)
        const displayToolbar = checkQueryParamValue("toolbar", "displayToolbar", this.state.displayToolbar)
        const toolsbarOnFs = checkQueryParamValue("toolbarsfs", "toolsbarOnFs", true)

        const startbyfirstanno = query.has("startfirst")
            ? query.get("startfirst") === "true"
            : (query.get("startbyfirstanno") ? query.get('startbyfirstanno') === "true" : false);

        const shouldAutoPlayAnnotations = checkQueryParamValue("should_auto_play_annotations", "shouldAutoStart", false)
        const rotation = checkQueryParamValue("rotation", "rotation", false)

        const isAnnotationsVisible = checkQueryParamValue("anno_bounds", "anno_bounds", false)

        const tags = query.get("tags") || this.state.tags
        const showOutlines = checkQueryParamValue("show_outlines", "showOutlines", this.state.showOutlines)
        const showCurrentAnnotation = checkQueryParamValue("show_only_current_annotation", "showCurrentAnnotation", this.state.showCurrentAnnotation)

        const showEyes = checkQueryParamValue("show_eyes", "showEyes", this.state.showEyes)

        const soundMode = checkQueryParamValue("sound_mode", "soundMode", false)

        const contentPosition = query.has("content_position")
            ? query.get("content_position")
            : this.state.contentPosition || 'left'

        const mosaicRatio = query.has("mosaic_ratio")
            ? query.get("mosaic_ratio")
            : this.state.mosaicRatio || '1/2'

        const mosaicRotation = query.has("mosaic_rotation")
            ? Number(query.get("mosaic_rotation"))
            : this.state.mosaicRotation || 0

        const outlineWidth = query.has("outlineWidth")
            ? query.get("outlineWidth")
            : this.state.outlineWidth ? this.state.outlineWidth : "outline-1px";
        const outlineColor = query.has("outlineColor")
            ? query.get("outlineColor")
            : this.state.outlineColor ? this.state.outlineColor : "outline-white";
        const outlineColorFocus = query.has("outlineColorFocus")
            ? query.get("outlineColorFocus")
            : this.state.outlineColorFocus ? this.state.outlineColorFocus : "outline-focus-yellow";

        const settings = {
            delay,
            showNavigator,
            toolsbarOnFs,
            sidebarEnabled: true,
            startbyfirstanno,
            shouldAutoPlayAnnotations,
            rotation,
            isAnnotationsVisible,
            showToolbar: displayToolbar,
            tags,
            showOutlines,
            showEyes,
            soundMode,
            outlineWidth,
            outlineColor,
            outlineColorFocus,
            showCurrentAnnotation,
            contentPosition,
            mosaicRatio,
            mosaicRotation,
            settingsReady: true
        }

        // Update settings
        this.setState({ ...settings });
    };

    changeSelectedAnno = (annotation, targetIndex = 0) => {
        this.setState({ selectedAnno: annotation || null, selectedTargetIndex: targetIndex })
    }

    changeShowToolbar = () => {
        this.setState({ showToolbar: !this.state.showToolbar })
    }

    embeddedProject = () => {
        return {
            ...this.state.project,
            annotations: this.state.annos
        }
    }

    loadProject = (project) => {
        const selectedTags = project.settings.tags || []

        this.setState({
            ...project.settings,
            project,
            annos: annotationsTagged(project.annotations, selectedTags),
            isLoaded: true
        }, this.overrideSettings)
    }

    getAdnoProject = (url) => {
        const IPFS_GATEWAY = process.env.IPFS_GATEWAY;

        const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;

        const isIpfsUrl = url.match(regexCID) || url.startsWith(IPFS_GATEWAY);
        if (isIpfsUrl && !url.startsWith(IPFS_GATEWAY)) url = IPFS_GATEWAY + url;

        return enhancedFetch(decodeURIComponent(url))
            .then(rawResponse => {
                const { response } = rawResponse

                if (!response.ok) {
                    toast.error(this.props.t('errors.unable_access_file'))
                    return
                }

                const contentType = response.headers.get('Content-Type')

                if (!JSON_CONTENT_TYPES.some(type => contentType.includes(type))) {
                    this.loadProject(buildJsonProjectWithImg(EMBED_ID, '', '', url))
                    return
                }

                return response.text()
                    .then(data => this.loadDocument(JSON.parse(data)))
            })
    };

    loadDocument = (document) => {
        const project = fromAny(document, { id: EMBED_ID })

        if (!project) {
            toast.error(this.props.t('errors.unable_reading_manifest'))
            return
        }

        this.loadProject(project)
    }

    render() {
        if (!this.state.isLoaded || !this.state.settingsReady)
            return <div className="loader">
                <InfinitySpin
                    width='200'
                    height="200"
                    color="black"
                />
            </div>

        return (
            <div id="adno-embed">
                <OpenView
                    selectedProject={this.embeddedProject()}
                    annos={this.state.annos}
                    selectedAnno={this.state.selectedAnno}
                    selectedTargetIndex={this.state.selectedTargetIndex}
                    changeSelectedAnno={this.changeSelectedAnno}
                    initialAnnotationsVisible={this.state.isAnnotationsVisible}
                    crossOriginPolicy={false}
                    contentPosition={this.state.contentPosition}
                    mosaicRatio={this.state.mosaicRatio}
                    mosaicRotation={this.state.mosaicRotation}
                    tags={Array.isArray(this.state.tags) ? this.state.tags : []}
                    showToolbar={this.state.showToolbar}
                    changeShowToolbar={this.changeShowToolbar}
                    toolsbarOnFs={this.state.toolsbarOnFs}
                    showNavigator={this.state.showNavigator}
                    rotation={this.state.rotation}
                    defaultRotation={this.state.defaultRotation}
                    rotationTransition={this.state.rotationTransition}
                    startbyfirstanno={this.state.startbyfirstanno}
                    shouldAutoPlayAnnotations={this.state.shouldAutoPlayAnnotations}
                    timerDelay={this.state.delay}
                    showOutlines={this.state.showOutlines}
                    showCurrentAnnotation={this.state.showCurrentAnnotation}
                    showEyes={this.state.showEyes}
                    soundMode={this.state.soundMode}
                    outlineWidth={this.state.outlineWidth}
                    outlineColor={this.state.outlineColor}
                    outlineColorFocus={this.state.outlineColorFocus}
                    updateAutoplayId={() => { }}
                    setAudioContexts={() => { }} />
            </div>
        )
    }
}

export default withTranslation()(withRouter(AdnoEmbed));
