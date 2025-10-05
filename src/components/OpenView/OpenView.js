import { Component } from "react";
import { withRouter } from "react-router-dom";
import parse from 'html-react-parser';

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotate, faQuestion, faVolumeOff, faVolumeHigh, faCircleInfo, faExternalLink } from "@fortawesome/free-solid-svg-icons";

// Import utils
import { checkIfProjectExists, getEye } from "../../Utils/utils";

// // Import OpenSeaDragon and Annotorious
// import "/libraries/openseadragon/openseadragon-annotorious.min.js";

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
            currentTrack: undefined,
            soundMode: this.props.soundMode,
            audioContexts: []
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

            const annoStyles = this.props.outlineWidth + " " + this.props.outlineColor + " " + this.props.outlineColorFocus;

            const annoFormatter = function () {
                return annoStyles;
            }

            this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
                locale: 'auto',
                drawOnSingleClick: true,
                allowEmpty: true,
                disableEditor: true,
                readOnly: true,
                formatters: annoFormatter
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
                        this.loadAudio()
                        this.toggleOutlines(this.props.showOutlines)

                        this.automaticStart()
                    }, 200)
                })
        }

        addEventListener('fullscreenchange', this.updateFullScreenEvent);
        addEventListener('keydown', this.keyPressedEvents)
    }

    automaticStart = () => {
        if (this.props.shouldAutoPlayAnnotations) {
            this.startTimer()
        }
    }

    toggleOutlines = showOutlines => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]
        annos.forEach(anno => {
            if (showOutlines)
                [...anno.children].forEach(r => {
                    if (!r.classList.contains("eye"))
                        r.classList.remove("a9s-annotation--hidden")
                })
            else
                [...anno.children].forEach(r => {
                    if (!r.classList.contains("eye"))
                        r.classList.add("a9s-annotation--hidden")
                })
        })
    }

    freeMode = () => {
        if (this.props.showEyes) {
            const annos = [...document.getElementsByClassName("a9s-annotation")]

            annos.map((anno, i) => {
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

    automateLoading = timeout => {
        const { currentID } = this.state;
        let newCurrentID = currentID;

        if (currentID === -1 || currentID === this.props.annos.length - 1) {
            newCurrentID = 0
        } else {
            newCurrentID++;
        }

        this.setState({ currentID: newCurrentID })

        this.changeAnno(this.props.annos[newCurrentID])

        this.showOnlyCurrentAnnotation(this.props.annos[newCurrentID].id)

        if (timeout) {
            const id = this.props.annos[newCurrentID].id;

            const annotation = [...document.getElementsByClassName("a9s-annotation")]
                .find(elt => elt.getAttribute("data-id") === id)

            let delay = timeout;
            if (annotation) {
                const duration = annotation.getElementsByTagName("audio")[0]?.duration;

                if (duration) {
                    delay = duration * 1000 + 1500
                }
            }

            const interID = setTimeout(() => this.automateLoading(delay), delay);
            this.setState({
                intervalID: interID
            })
        }
    }

    cancelShowOnlyAnnotation = () => {
        this.toggleAnnotations(this.state.isAnnotationsVisible)
    }

    showOnlyCurrentAnnotation = annotationId => {
        const showOutlinesOrEyes = (this.props.showOutlines || this.props.showEyes) && this.props.isAnnotationsVisible

        if (showOutlinesOrEyes && this.props.showCurrentAnnotation) {
            const annos = [...document.getElementsByClassName("a9s-annotation")]

            // HIDE ALL ANNOS AND EYES
            annos.forEach(anno => {
                const id = anno.getAttribute('data-id')
                const eye = document.getElementById(`eye-${id}`);

                [...anno.children].forEach(r => r.classList.add("a9s-annotation--hidden"))
            })

            const currentAnnotation = annos.find(anno => anno.getAttribute('data-id') === annotationId)

            Array.from(currentAnnotation.children).forEach(r => {
                const isEye = r.classList.contains('eye')
                const showChild = isEye ? this.props.showEyes : this.props.showOutlines

                if (showChild)
                    r.classList.remove("a9s-annotation--hidden")
            })
        }
    }

    changeAnno = (annotation) => {
        if (annotation && annotation.id) {
            this.props.changeSelectedAnno(annotation)

            this.AdnoAnnotorious.selectAnnotation(annotation.id)
            this.AdnoAnnotorious.fitBounds(annotation.id)

            let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

            this.setState({ currentID: annotationIndex })

            if (this.props.soundMode === 'no_spatialization') {
                const { currentTrack } = this.state

                if (currentTrack) {
                    currentTrack.pause()
                    currentTrack.currentTime = 0;
                }

                const annos = [...document.getElementsByClassName("a9s-annotation")]
                const annoSvg = annos.find(anno => anno.getAttribute('data-id') === annotation.id)

                if (annoSvg) {
                    const audioElement = [...annoSvg.getElementsByTagName("audio")];

                    if (audioElement.length > 0) {
                        const source = audioElement[0]

                        source.play()

                        this.setState({
                            currentTrack: source
                        })
                    }
                }
            }

            if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest"
                });

                this.props.annos.forEach(anno => document.getElementById(`eye-${anno.id}`)?.classList.remove('eye-selected'))
                document.getElementById(`eye-${annotation.id}`)?.classList.add('eye-selected')

                this.updateCurrentAnnotationColors(annotation.id)
            }
        }
    }

    updateCurrentAnnotationColors = annotationId => {
        try {
            const eye = document.getElementById(`eye-${annotationId}`)?.parentElement?.className?.animVal;
            const shape = [...document.getElementsByClassName('selected')][0]?.className?.animVal;

            const className = eye ? eye : shape;

            if (className) {
                const regex = /outline-([a-zA-Z]+)/g;
                const matches = [...className.matchAll(regex)].map(match => match[1]);

                const color = matches.filter(f => ['green', 'white', 'red', 'orange', 'yellow', 'blue', 'violet', 'black'].includes(f))[0]

                const style = window.getComputedStyle(document.body)

                document.documentElement.style.setProperty('--selected-anno-border-color',
                    style.getPropertyValue(`--outline-${color}`) || '#fde047')
                document.documentElement.style.setProperty('--selected-anno-background-color',
                    `${style.getPropertyValue(`--outline-${color}`)}1c` || '#fefce8')
            }

        } catch (err) { }
    }

    playSound = (audioElement, soundMode) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const track = new MediaElementAudioSourceNode(audioCtx, {
            mediaElement: audioElement,
        });

        const posX = 0;
        const posY = window.innerHeight / 2;
        const posZ = 300;

        const panner = new PannerNode(audioCtx, {
            panningModel: "HRTF",
            distanceModel: "linear",
            positionX: posX,
            positionY: posY,
            positionZ: posZ,
            orientationX: 0.0,
            orientationY: 0.0,
            orientationZ: -1.0,
            refDistance: 1,
            maxDistance: 20_000,
            rolloffFactor: 10,
            coneInnerAngle: 40,
            coneOuterAngle: 50,
            coneOuterGain: 0.4,
        })

        track
            .connect(panner)
            .connect(audioCtx.destination)

        const viewer = this.openSeadragon;

        function updateSoundPosition(svgElement) {
            const viewportCenter = viewer.viewport.getCenter(true);

            const x = Number(svgElement.getAttribute('x'))
            const y = Number(svgElement.getAttribute('y'))

            panner.positionX.value = -((viewportCenter.x - x) * 200);
            panner.positionY.value = -(((viewportCenter.y * 2) - y) * 200)

            // console.log(svgElement, panner.positionX.value, panner.positionY.value)
        }

        viewer.addHandler('animation', () => updateSoundPosition(audioElement));
        viewer.addHandler('pan', () => updateSoundPosition(audioElement));
        viewer.addHandler('zoom', () => updateSoundPosition(audioElement));

        audioElement.crossOrigin = "anonymous";
        audioElement.play()

        if (soundMode !== 'spatialization')
            audioCtx.suspend()

        this.setState({
            audioContexts: [...this.state.audioContexts, audioCtx]
        }, () => this.props.setAudioContexts(this.state.audioContexts))
    }

    clearTimer = () => {
        this.setState({ timer: false })
        clearInterval(this.state.intervalID)

        this.cancelShowOnlyAnnotation()
    }

    startTimer = () => {
        // Do not start the timer if there is no content to display
        if (this.props.annos.length > 0) {
            if (this.props.startbyfirstanno) {
                this.setState({ currentID: -1 })

                this.changeAnno(this.props.annos[0])
            } else {
                this.automateLoading()
            }

            const delay = this.props.timerDelay * 1000;

            // Call the function to go to the next annotation every "timerDelay" seconds
            const interID = setTimeout(() => this.automateLoading(delay), delay);
            this.setState({
                timer: true,
                intervalID: interID
            })
            this.props.updateAutoplayId(interID)
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

            this.showOnlyCurrentAnnotation(this.props.annos[localCurrentID].id)


            if (this.props.annos[localCurrentID].id && document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`)) {
                document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }

        }
        this.resetFullscreenAnnotationScrolling()
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

            this.showOnlyCurrentAnnotation(this.props.annos[localCurrentID].id)

            this.resetFullscreenAnnotationScrolling()
        }
    }

    resetFullscreenAnnotationScrolling = () => {
        const fullscreenAnnotation = document.getElementById('adno-osd-anno-fullscreen');

        if (fullscreenAnnotation)
            fullscreenAnnotation.scrollTop = 0;
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

    toggleAudioElementLoopAttribute = looping => {
        [...document.getElementsByClassName("a9s-annotation")]
            .forEach(annotation => {
                const audioElement = annotation.getElementsByTagName("audio")[0];

                if (audioElement)
                    audioElement.loop = looping
            });
    }

    applySound = soundMode => {
        if (soundMode === 'spatialization') {
            this.state.audioContexts.forEach(r => r.resume());
            this.toggleAudioElementLoopAttribute(true)
        } else if (soundMode === 'no_spatialization' || soundMode === 'no_sound') {
            this.state.audioContexts.forEach(r => r.suspend())
            this.toggleAudioElementLoopAttribute(false)

            if (soundMode === 'no_sound') {
                [...document.getElementsByClassName("a9s-annotation")]
                    .forEach(annotation => {
                        const audioElement = annotation.getElementsByTagName("audio")[0];

                        if (audioElement) {
                            audioElement.currentTime = 0;
                            audioElement.pause()
                        }
                    });
            }
        }
        else {
            if (this.state.currentTrack) {
                this.state.currentTrack.currentTime = 0;
                this.state.currentTrack.play()
            }
        }
    }

    reloadAnnotationsFromProps = () => {
        const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
        this.AdnoAnnotorious.loadAnnotations(dataURI)

        this.loadAudio()

        setTimeout(this.freeMode, 1000)
        setTimeout(() => this.changeAnno(this.props.selectedAnno), 1000)
    }

    componentDidUpdate(prevProps, prevState) {
        // check when there is a new selected annotation from the sidebar
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
        }

        if (prevProps.annos !== this.props.annos) {
            this.reloadAnnotationsFromProps()
        }

        if (prevProps.outlineWidth !== this.props.outlineWidth ||
            prevProps.outlineColor !== this.props.outlineColor ||
            prevProps.outlineColorFocus !== this.props.outlineColorFocus
        ) {
            const annoStyles = this.props.outlineWidth + " " + this.props.outlineColor + " " + this.props.outlineColorFocus;
            this.AdnoAnnotorious.formatters = [() => annoStyles]

            this.reloadAnnotationsFromProps()
        }

        if (prevProps.soundMode !== this.props.soundMode) {
            this.setState({ soundMode: this.props.soundMode }, () => this.applySound(this.state.soundMode))
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

    loadAudio = () => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]

        annos.forEach(anno => {
            const audioElement = document.createElement('audio')
            audioElement.volume = this.state.soundMode !== 'no_sound' ? 1 : 0
            audioElement.loop = this.props.soundMode === 'spatialization' ? true : false

            const type = [...anno.children][0].tagName
            const tileSize = document.getElementById('adno-osd').clientWidth / 5

            let x, y = 0;
            if (type === "ellipse" || type == "circle") {
                x = anno.children[0].getAttribute("cx") - tileSize / 2;
                y = anno.children[0].getAttribute("cy") - tileSize / 2

            } else if (type === "rect") {
                x = anno.children[0].getAttribute("x") - tileSize / 2 + anno.children[0].getAttribute("width") / 2
                y = anno.children[0].getAttribute("y") - tileSize / 2 + anno.children[0].getAttribute("height") / 2


            } else if (type === "path" || type === "polygon") {
                const bbox = anno.getBBox();

                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;

                x = centerX - tileSize / 2
                y = centerY - tileSize / 2
            }

            audioElement.setAttribute('x', x / this.openSeadragon.viewport._contentSize.x)
            audioElement.setAttribute('y', y / this.openSeadragon.viewport._contentSize.y)


            const id = anno.getAttribute("data-id")
            const annotation = this.props.annos?.find(anno => anno.id === id);

            if (annotation && annotation.body && Array.isArray(annotation.body)) {
                const track = annotation.body.find(body => body.type === "SpecificResource")

                if (track) {
                    const sourceElement = document.createElement('source')
                    sourceElement.src = track.source?.id
                    audioElement.appendChild(sourceElement)

                    const unimplemented = document.createElement("p")
                    unimplemented.textContent = "Your browser doesn't support the HTML5 audio element"
                    audioElement.appendChild(unimplemented)

                    anno.appendChild(audioElement)

                    setTimeout(() => {
                        this.playSound(audioElement.cloneNode(true), this.props.soundMode)
                    }, 1000)
                }
            }

        })
    }

    toggleAnnotations = (visible) => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]
        annos.forEach(anno => {
            [...anno.children].forEach(r => {
                if (visible) {
                    const isEye = r.classList.contains('eye')
                    const showChild = isEye ? this.props.showEyes : this.props.showOutlines

                    if (isEye)
                        r.classList.remove('eye-selected')

                    if (showChild) {
                        r.classList.remove("a9s-annotation--hidden")
                    } else {
                        r.classList.add("a9s-annotation--hidden")
                    }

                } else {
                    r.classList.add("a9s-annotation--hidden")
                }
            })
        })
    }


    toggleAnnotationsLayer = () => {
        this.toggleAnnotations(!this.state.isAnnotationsVisible)
        this.setState({ isAnnotationsVisible: !this.state.isAnnotationsVisible })
    }

    getAnnotationHTMLBody = (annotation) => {
        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) &&
                annotation.body.find(annoBody => annoBody.type === "HTMLBody") &&
                annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return (
                    <div className={this.props.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"} id="adno-osd-anno-fullscreen">
                        {parse(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)}
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
                            <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.state.timer ? this.clearTimer() : this.startTimer()}>
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
                                    <FontAwesomeIcon icon={faRotate} size="lg" />
                                </div>
                            </button>
                        }
                        <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}>
                            <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.expand')}>
                                <FontAwesomeIcon icon={faExpand} size="lg" />
                            </div>
                        </button>
                        <button id="info" className="toolbarButton toolbaractive">
                            <label htmlFor="info-modal" className="tooltip tooltip-bottom z-50 cursor-pointer" data-tip={this.props.t('visualizer.info')}
                                style={{ display: 'block' }}>
                                <FontAwesomeIcon icon={faCircleInfo} size="lg" />
                            </label>
                        </button>
                        <button id="help" className="toolbarButton toolbaractive">
                            <label htmlFor="help-modal" className="tooltip tooltip-bottom z-50 cursor-pointer" data-tip={this.props.t('visualizer.help')}
                                style={{ display: 'block' }}>
                                <FontAwesomeIcon icon={faQuestion} size="lg" />
                            </label>
                        </button>

                        <input type="checkbox" id="info-modal" className="modal-toggle" />
                        <div className="modal">
                            <div className="modal-box" style={{ "color": "initial" }}>
                                <div className="modal-action mt-0 justify-end">
                                    <button className="btn btn-square btn-sm">
                                        <label htmlFor="info-modal" className="cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </label>
                                    </button>
                                </div>
                                <h3 className="font-bold text-2xl py-4">{this.props.selected_project.title}</h3>
                                {
                                    this.props.selected_project.description &&
                                    <>
                                        <p className="py-4">{this.props.selected_project.description}</p>
                                    </>
                                }
                                <dl className="divide-y">
                                    {
                                        this.props.selected_project.creator &&
                                        <>
                                            <div className="flex py-2">
                                                <dt className="font-medium px-2">{this.props.t('project.author')} :</dt>
                                                <dd>{this.props.selected_project.creator}</dd>
                                            </div>
                                        </>
                                    }
                                    {
                                        this.props.selected_project.editor &&
                                        <>
                                            <div className="flex py-2">
                                                <dt className="font-medium px-2">{this.props.t('project.editor')} :</dt>
                                                <dd>{this.props.selected_project.editor}</dd>
                                            </div>
                                        </>
                                    }
                                    {
                                        this.props.selected_project.rights &&
                                        <>
                                            <div className="flex py-2">
                                                <dt className="font-medium px-2">{this.props.t('project.metadatas.rights')} :</dt>
                                                <dd>{this.props.selected_project.rights}</dd>
                                            </div>
                                        </>
                                    }
                                </dl>
                            </div>
                        </div>

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
                                <h3 className="font-bold text-2xl py-4">{this.props.t('visualizer.help_title')}</h3>
                                <ul className="list-disc">
                                    <li className="py-2">{this.props.t('visualizer.help_key_plural')} <code>P</code> {this.props.t('visualizer.help_or')} <code>p</code> {this.props.t('visualizer.help_key_p')}</li>
                                    <li className="py-2">{this.props.t('visualizer.help_key_plural')} <code>E</code> {this.props.t('visualizer.help_or')} <code>e</code> {this.props.t('visualizer.help_key_e')}</li>
                                    <li className="py-2">{this.props.t('visualizer.help_key')} <code>esc</code> {this.props.t('visualizer.help_key_escape')}</li>
                                    <li className="py-2">{this.props.t('visualizer.help_key_plural')} <code>S</code> {this.props.t('visualizer.help_or')} <code>s</code>{this.props.t('visualizer.help_key_s')}</li>
                                    <li className="py-2">{this.props.t('visualizer.help_key_plural')} <code>T</code>{this.props.t('visualizer.help_or')} <code>t</code> {this.props.t('visualizer.help_key_t')}</li>
                                    <li className="py-2">{this.props.t('visualizer.help_key_plural')} <code>←</code> {this.props.t('visualizer.help_and')} <code>→</code> {this.props.t('visualizer.help_key_arrows')}</li>
                                </ul>
                                <p className="py-4">{this.props.t('visualizer.help_doc')} <a className="adno-link" href="https://adno.app/" target="_blank"><FontAwesomeIcon icon={faExternalLink} size="lg" /></a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter(OpenView))
