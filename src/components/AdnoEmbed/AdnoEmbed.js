import { Component } from "react";
import { withRouter } from "react-router";
import { withTranslation } from "react-i18next";
import { InfinitySpin } from 'react-loader-spinner'
import Swal from "sweetalert2";

import { buildTagsList, enhancedFetch, get_url_extension } from "../../Utils/utils";
import { extractIIIFContent } from "./IIIFHelper";
import OpenView from "../OpenView/OpenView";

// Import Style
import "./AdnoEmbed.css";

const IMAGE_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS?.split(",") || [];

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
        const query = new URLSearchParams(this.props.location.search);

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
        const { source, title, description, creator, editor, rights, annos } = this.state
        const isImage = IMAGE_EXTENSIONS.includes(get_url_extension(source))

        return {
            id: 'adno-embed',
            title,
            description,
            creator,
            editor,
            rights,
            [isImage ? 'img_url' : 'manifest_url']: source,
            annotations: annos
        }
    }

    getAdnoProject = (url) => {
        const IPFS_GATEWAY = process.env.IPFS_GATEWAY;

        const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;

        const isIpfsUrl = url.match(regexCID) || url.startsWith(IPFS_GATEWAY);
        if (isIpfsUrl && !url.startsWith(IPFS_GATEWAY)) url = IPFS_GATEWAY + url;

        return enhancedFetch(decodeURIComponent(url))
            .then(rawResponse => {
                const { response } = rawResponse
                if (response.ok) {
                    const contentType = response.headers.get('Content-Type')
                    if (['application/json', 'text/html', 'text/plain', 'application/octet-stream',
                        'application/vnd.api+json', 'application/ld+json', 'application/x-json-stream', 'text/json'
                    ].find(c => contentType.includes(c)) ||
                        contentType.includes("application/json")) {
                        response.text()
                            .then(data => {
                                const imported_project = JSON.parse(data);

                                // ADNO project detected

                                if (
                                    imported_project.hasOwnProperty("format") &&
                                    imported_project.format === "Adno"
                                ) {
                                    if (
                                        imported_project.hasOwnProperty("@context") &&
                                        imported_project.hasOwnProperty("date") &&
                                        imported_project.hasOwnProperty("id") &&
                                        (imported_project.hasOwnProperty("title") ||
                                            imported_project.hasOwnProperty("label")) &&
                                        imported_project.hasOwnProperty("type") &&
                                        imported_project.hasOwnProperty("modified") &&
                                        imported_project.hasOwnProperty("source") &&
                                        imported_project.hasOwnProperty("total")
                                    ) {
                                        const selectedTags = imported_project.adno_settings?.tags || [];

                                        let annos = [...imported_project.first.items];

                                        if (selectedTags.length > 0)
                                            annos = annos
                                                .map(annotation => ({
                                                    ...annotation,
                                                    tags: buildTagsList(annotation).map(tag => tag.value)
                                                }))
                                                .filter(annotation => annotation.tags.find(tag => selectedTags.includes(tag)))

                                        annos?.forEach((annotation) => {
                                            if (
                                                annotation.body.find(
                                                    (annoBody) => annoBody.type === "TextualBody"
                                                ) &&
                                                !annotation.body.find(
                                                    (annoBody) => annoBody.type === "HTMLBody"
                                                )
                                            ) {
                                                const newBody = annotation.body;

                                                newBody.push({
                                                    type: "HTMLBody",
                                                    value: `<p>${annotation.body.filter(
                                                        (annobody) => annobody.type === "TextualBody"
                                                    )[0].value
                                                        }</p>`,
                                                    purpose: "commenting",
                                                });

                                                annos.filter((anno) => anno.id === annotation.id)[0].body =
                                                    newBody;
                                            }
                                        });

                                        this.setState({
                                            ...(imported_project.adno_settings || {}),
                                            title: imported_project.title,
                                            description: imported_project.description,
                                            creator: imported_project.creator,
                                            editor: imported_project.editor,
                                            rights: imported_project.rights,
                                            source: imported_project.source,
                                            annos,
                                            isLoaded: true
                                        }, this.overrideSettings);
                                    } else {
                                        Swal.fire({
                                            title: `projet adno INVALIDE`,
                                            showCancelButton: false,
                                            showConfirmButton: false,
                                            icon: "error",
                                        });
                                    }
                                } else {
                                    // Check if it's a manifest

                                    if (
                                        (imported_project.hasOwnProperty("id") ||
                                            imported_project.hasOwnProperty("@id")) &&
                                        (imported_project.hasOwnProperty("context") ||
                                            imported_project.hasOwnProperty("@context"))
                                    ) {
                                        extractIIIFContent(imported_project, {
                                            overrideSettings: this.overrideSettings,
                                            setState: (opts, callback) => this.setState({ ...opts }, callback),
                                            props: this.props
                                        })
                                    } else {
                                        console.log("projet non adno INVALIDE");
                                    }
                                }
                            })
                    } else {
                        this.setState({ isLoaded: true, source: url }, this.overrideSettings);
                    }
                } else {
                    Swal.fire({
                        title: this.props.t('errors.unable_access_file'),
                        showCancelButton: false,
                        showConfirmButton: false,
                        icon: "error",
                    });
                }
            })
    };

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
                    permanentOverlay
                    contentPosition={this.state.contentPosition}
                    multiviewDisposition={this.state.multiviewDisposition}
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
