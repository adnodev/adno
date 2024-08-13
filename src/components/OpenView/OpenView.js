import { Component } from "react";
import { withRouter } from "react-router-dom";
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight, faQuestion } from "@fortawesome/free-solid-svg-icons";


// Import utils
import { checkIfProjectExists, getEye } from "../../Utils/utils";

// Import OpenSeaDragon and Annotorious
import "../../libraries/openseadragon/openseadragon-annotorious.min.js";

// Import CSS
import "./OpenView.css";
import { withTranslation } from "react-i18next";


class OpenView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentID: -1,
            timer: false,
            intervalID: 0,
            fullScreenEnabled: false,
            isAnnotationsVisible: true,
        }
    }

    componentDidMount() {
        // First of all, verify if the UUID match to an real project in the localStorage
        // If not, then redirect the user to the HomePage
        if (!this.props.match.params.id || !checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        } else {
            let tileSources;

            if (this.props.selected_project.manifest_url) {
                tileSources = [
                    this.props.selected_project.manifest_url
                ]

            } else {
                tileSources = {
                    type: 'image',
                    url: this.props.selected_project.img_url
                }
            }

            this.openSeadragon = OpenSeadragon({
                id: 'adno-osd',
                homeButton: "home-button",
                showNavigator: this.props.showNavigator,
                tileSources: tileSources,
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
                crossOriginPolicy: 'Anonymous',
                ajaxWithCredentials: false
            })

            OpenSeadragon.setString("Tooltips.FullPage", this.props.t('editor.fullpage'));
            OpenSeadragon.setString("Tooltips.Home", this.props.t('editor.home'));
            OpenSeadragon.setString("Tooltips.ZoomIn", this.props.t('editor.zoom_in'));
            OpenSeadragon.setString("Tooltips.ZoomOut", this.props.t('editor.zoom_out'));
            OpenSeadragon.setString("Tooltips.NextPage", this.props.t('editor.next_page'));
            OpenSeadragon.setString("Tooltips.PreviousPage", this.props.t('editor.previous_page'));
            OpenSeadragon.setString("Tooltips.RotateLeft", this.props.t('editor.rotate_left'));
            OpenSeadragon.setString("Tooltips.RotateRight", this.props.t('editor.rotate_right'));
            OpenSeadragon.setString("Tooltips.Flip", this.props.t('editor.flip'));

            this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
                locale: 'auto',
                drawOnSingleClick: true,
                allowEmpty: true,
                disableEditor: true,
                readOnly: true
            });

            this.AdnoAnnotorious.on('clickAnnotation', (annotation) => {
                if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                    document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

                    this.props.annos.forEach(anno => document.getElementById(`eye-${anno.id}`)?.classList.remove('eye-selected'))
                    document.getElementById(`eye-${annotation.id}`)?.classList.add('eye-selected')
                }

                this.AdnoAnnotorious.fitBounds(annotation.id)

                let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

                this.setState({ currentID: annotationIndex })
                this.props.changeSelectedAnno(annotation)
            });

            // Generate dataURI and load annotations into Annotorious
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)
                .then(() => {
                    setTimeout(() => {
                        this.freeMode()
                        this.toggleOutlines(this.props.showOutlines)
                    }, 200)
                })
        }

        addEventListener('fullscreenchange', this.updateFullScreenEvent);
        addEventListener('keydown', this.keyPressedEvents)
    }

    toggleOutlines = showOutlines => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]
        annos.forEach(anno => {
            if (showOutlines)
                [...anno.children].forEach(r => {
                    r.classList.remove("a9s-annotation--hidden")
                })
            else
                [...anno.children].forEach(r => {
                    r.classList.add("a9s-annotation--hidden")
                })
        })
    }

    freeMode = () => {
        if (this.props.showEyes) {
            const annos = [...document.getElementsByClassName("a9s-annotation")]

            annos.map(anno => {
                const svgElement = getEye()

                const tileSize = document.getElementById('adno-osd').clientWidth / 5 

                svgElement.setAttribute('width', tileSize);
                svgElement.setAttribute('height', tileSize);

                svgElement.style.fill = "#000"
                svgElement.style.stroke = "#000"
                svgElement.style.strokeWidth = 2
                svgElement.classList.add('eye')
                svgElement.id = `eye-${anno.getAttribute('data-id')}`;

                const type = [...anno.children][0].tagName

                if (type === "ellipse" || type == "circle") {
                    svgElement.setAttribute('x', anno.children[0].getAttribute("cx") - tileSize / 2);
                    svgElement.setAttribute('y', anno.children[0].getAttribute("cy") - tileSize / 2);

                    if (anno.classList.contains("a9s-point")) {
                        anno.removeAttribute("transform", "")

                        anno.classList.remove("a9s-point")
                        anno.classList.remove("a9s-non-scaling")
                    }

                    anno.appendChild(svgElement)
                } else if (type === "rect") {
                    svgElement.setAttribute('x', anno.children[0].getAttribute("x") - tileSize / 2 + anno.children[0].getAttribute("width") / 2);
                    svgElement.setAttribute('y', anno.children[0].getAttribute("y") - tileSize / 2 + anno.children[0].getAttribute("height") / 2);

                    anno.appendChild(svgElement)
                } else if (type === "path" || type === "polygon") {
                    const bbox = anno.getBBox();

                    const centerX = bbox.x + bbox.width / 2;
                    const centerY = bbox.y + bbox.height / 2;

                    svgElement.setAttribute('x', centerX - tileSize / 2);
                    svgElement.setAttribute('y', centerY - tileSize / 2);

                    anno.appendChild(svgElement)
                }

                // [...anno.children].map(r => {
                //     r.classList.add("a9s-annotation--hidden")
                // })
            })
        } else {
            [...document.getElementsByClassName('eye')].forEach(r => r.remove())
        }
    }

    keyPressedEvents = (event) => {
        switch (event.code) {
            case "ArrowRight":
                this.nextAnno()
                break;
            case "ArrowLeft":
                this.previousAnno()
                break;
            case "KeyP":
                this.startTimer()
                break;
            case "KeyE":
                this.toggleFullScreen()
                break;
            case "KeyS":
                this.toggleAnnotationsLayer()
                break;
            case "KeyT":
                this.props.changeShowToolbar()
                break;
            default:
                break;
        }
    }

    updateFullScreenEvent = (event) => {
        // turn off fullscreen
        if (document.fullscreenEnabled && !document.fullscreenElement) {
            this.setState({ fullScreenEnabled: false })
        }
    }

    componentWillUnmount() {
        removeEventListener("keydown", this.keyPressedEvents)
        removeEventListener("fullscreenchange", this.updateFullScreenEvent)
    }

    automateLoading = () => {
        let localCurrentID = this.state.currentID;

        if (this.state.currentID === -1) {
            localCurrentID = 0
        } else if (this.state.currentID === this.props.annos.length - 1) {
            localCurrentID = 0
        } else {
            localCurrentID++;
        }

        this.setState({ currentID: localCurrentID })

        this.changeAnno(this.props.annos[localCurrentID])
    }

    changeAnno = (annotation) => {
        if (annotation && annotation.id) {
            this.props.changeSelectedAnno(annotation)

            // if (this.state.isAnnotationsVisible) {
            this.AdnoAnnotorious.selectAnnotation(annotation.id)
            this.AdnoAnnotorious.fitBounds(annotation.id)
            // } else {
            //     if (annotation.target && annotation.target.selector.value) {
            //         var imgWithTiles = this.openSeadragon.world.getItemAt(0);
            //         var xywh = annotation.target.selector.value.replace("xywh=pixel:", "").split(",")
            //         var rect = new OpenSeadragon.Rect(parseFloat(xywh[0]), parseFloat(xywh[1]), parseFloat(xywh[2]), parseFloat(xywh[3]))
            //         var imgRect = imgWithTiles.imageToViewportRectangle(rect);
            //         this.openSeadragon.viewport.fitBounds(imgRect);
            //     }
            // }

            let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

            this.setState({ currentID: annotationIndex })

            if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
                this.props.annos.forEach(anno => document.getElementById(`eye-${anno.id}`)?.classList.remove('eye-selected'))
                document.getElementById(`eye-${annotation.id}`)?.classList.add('eye-selected')
            }
        }
    }


    startTimer = () => {
        // Do not start the timer if there is no content to display
        if (this.props.annos.length > 0) {

            // Check if the timer is already started, clear the auto scroll between annotations
            if (this.state.timer) {
                this.setState({ timer: false })

                clearInterval(this.state.intervalID)
            } else {

                if (this.props.startbyfirstanno) {
                    this.setState({ currentID: -1 })

                    this.changeAnno(this.props.annos[0])
                } else {
                    this.automateLoading()

                }
                // Call the function to go to the next annotation every "timerDelay" seconds
                let interID = setInterval(this.automateLoading, this.props.timerDelay * 1000);
                this.setState({ timer: true, intervalID: interID })
                this.props.updateAutoplayId(interID)
            }
        }
    }

    previousAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.props.annos.length > 0) {

            if (this.state.currentID === -1 || this.state.currentID === 0) {
                localCurrentID = this.props.annos.length - 1
            } else {
                localCurrentID = this.state.currentID - 1
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.props.annos[localCurrentID])


            if (this.props.annos[localCurrentID].id && document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`)) {
                document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }

        }
    }

    nextAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.props.annos.length > 0) {

            if (this.state.currentID === -1 || this.state.currentID === this.props.annos.length - 1) {
                localCurrentID = 0
            } else {
                localCurrentID++;
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.props.annos[localCurrentID])
        }
    }

    toggleFullScreen = () => {
        // turn on full screen
        if (document.fullscreenEnabled) {
            if (!this.state.fullScreenEnabled) {
                if (document.getElementById("adno-osd")) {
                    document.getElementById("adno-osd").requestFullscreen();
                    this.setState({ fullScreenEnabled: true })
                } else {
                    alert("Unable to turn on FullScreen")
                }
            } else {
                document.exitFullscreen();
                this.setState({ fullScreenEnabled: false })
            }
        } else {
            alert("Fullscreen disabled")
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // check when there is a new selected annotation from the sidebar
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
        }

        if (prevProps.annos !== this.props.annos) {
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)

            setTimeout(this.freeMode, 1000)
        }

        if (prevProps.showOutlines !== this.props.showOutlines) {
            this.toggleOutlines(this.props.showOutlines)
        }

        if (prevProps.showEyes !== this.props.showEyes)
            setTimeout(this.freeMode, 1000)

        // Check if the user toggled the navigator on/off
        if (this.props.showNavigator !== prevProps.showNavigator) {
            if (this.props.showNavigator) {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'block';
            } else {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'none';
            }

        }
    }

    toggleAnnotations = () => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]
        annos.forEach(anno => {
            [...anno.children].forEach(r => {
                if (this.props.showOutlines) {
                    r.classList.toggle("a9s-annotation--hidden")
                } else if (r.classList.contains("eye")) {
                    r.classList.toggle("a9s-annotation--hidden")
                }
            })
        })
    }


    toggleAnnotationsLayer = () => {
        // this.AdnoAnnotorious.setVisible(!this.state.isAnnotationsVisible)

        this.toggleAnnotations()
        this.setState({ isAnnotationsVisible: !this.state.isAnnotationsVisible })
    }

    getAnnotationHTMLBody = (annotation) => {
        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return (
                    <div className={this.props.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>

                        {ReactHtmlParser(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)}
                    </div>
                )
            }
        }
    }

    render() {
        const showAnnotationsButton = this.props.showOutlines || this.props.showEyes

        return (
            <div id="adno-osd" style={{ position: 'relative' }}>
                {
                    this.state.fullScreenEnabled && this.props.selectedAnno && this.props.selectedAnno.body &&
                    this.getAnnotationHTMLBody(this.props.selectedAnno)
                }


                <div className={this.props.showToolbar ? "toolbar-on" : "toolbar-off"}>
                    <div className={this.state.fullScreenEnabled && this.props.toolsbarOnFs ? "osd-buttons-bar" : this.state.fullScreenEnabled && !this.props.toolsbarOnFs ? "osd-buttons-bar-hidden" : "osd-buttons-bar"}>

                        {
                            this.props.annos.length > 0 &&
                            <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}>
                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t(`visualizer.${this.state.timer ? 'pause' : 'play'}`)}>
                                    <FontAwesomeIcon icon={this.state.timer ? faPause : faPlay} size="lg" />
                                </div>
                            </button>
                        }

                        <button id="home-button" className="toolbarButton toolbaractive">
                            <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.reset_zoom')}>
                                <FontAwesomeIcon icon={faMagnifyingGlassMinus} size="lg" />
                            </div>
                        </button>

                        {
                            this.props.annos.length > 0 &&
                            <>
                                {showAnnotationsButton && <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.toggle_annotations')}>
                                        <FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg" />
                                    </div>
                                </button>}

                                <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.previous_annotation')}>
                                        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                                    </div>
                                </button>
                                <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.next_annotation')}>
                                        <FontAwesomeIcon icon={faArrowRight} size="lg" />
                                    </div>
                                </button>
                            </>
                        }

                        {
                            this.props.rotation &&
                            <button id="rotate" className="toolbarButton toolbaractive" onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees + 90)}>
                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.rotation')}>
                                    <FontAwesomeIcon icon={faRotateRight} size="lg" />
                                </div>
                            </button>
                        }
                        <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}>
                            <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.expand')}>
                                <FontAwesomeIcon icon={faExpand} size="lg" />
                            </div>
                        </button>
                        <button id="help" className="toolbarButton toolbaractive">
                            <label htmlFor="help-modal" className="tooltip tooltip-bottom z-50 cursor-pointer" data-tip={this.props.t('visualizer.help')}
                                style={{ display: 'block' }}>
                                <FontAwesomeIcon icon={faQuestion} size="lg" />
                            </label>
                        </button>

                        <input type="checkbox" id="help-modal" className="modal-toggle" />
                        <div className="modal">
                            <div className="modal-box" style={{ "color": "initial" }}>
                                <div className="modal-action mt-0 justify-end">
                                    <button className="btn btn-square btn-sm">
                                        <label htmlFor="help-modal" className="cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </label>
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg py-4">{this.props.t('visualizer.help_title')}</h3>
                                <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>P</code> {this.props.t('visualizer.help_or')} <code>p</code> {this.props.t('visualizer.help_key_p')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>E</code> {this.props.t('visualizer.help_or')} <code>e</code> {this.props.t('visualizer.help_key_e')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_key')} <code>esc</code> {this.props.t('visualizer.help_key_escape')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>S</code> {this.props.t('visualizer.help_or')} <code>s</code>{this.props.t('visualizer.help_key_s')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>T</code>{this.props.t('visualizer.help_or')} <code>t</code> {this.props.t('visualizer.help_key_t')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>←</code> {this.props.t('visualizer.help_and')} <code>→</code> {this.props.t('visualizer.help_key_arrows')}</p>
                                <p className="py-4">{this.props.t('visualizer.help_doc')} <a className="adno-link" href="https://adno.app/" target="_blank">{this.props.t('visualizer.help_doc_link')}</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter(OpenView));
