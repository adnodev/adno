import { Component } from "react";
import { withRouter } from "react-router-dom";
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faVectorSquare, faSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight } from "@fortawesome/free-solid-svg-icons";


// Import utils
import { checkIfProjectExists } from "../../Utils/utils";

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
            freeMode: true
        }
    }

    getEye() {
        // Define the SVG namespace
        const SVG_NS = "http://www.w3.org/2000/svg";

        // Create the main SVG element
        const svg = document.createElementNS(SVG_NS, "svg");
        // svg.setAttribute("xmlns", SVG_NS);
        // svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        // svg.setAttribute("version", "1.1");
        // svg.setAttribute("width", "1080");
        // svg.setAttribute("height", "1080");
        svg.setAttribute("viewBox", "0 0 1080 1080");
        // svg.setAttribute("xml:space", "preserve");

        svg.setAttribute("transform", "")


        // Create and append the first <g> element
        const g1 = document.createElementNS(SVG_NS, "g");
        g1.setAttribute("transform", "matrix(1 0 0 1 540 540)");
        g1.setAttribute("id", "c6a526e9-9dab-4148-b63e-bac2caea7bce");

        // Create and append the <rect> element inside the first <g>
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1; visibility: hidden;");
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        rect.setAttribute("x", "-540");
        rect.setAttribute("y", "-540");
        rect.setAttribute("rx", "0");
        rect.setAttribute("ry", "0");
        rect.setAttribute("width", "1080");
        rect.setAttribute("height", "1080");

        g1.appendChild(rect);
        svg.appendChild(g1);

        // Create and append the second <g> element
        const g2 = document.createElementNS(SVG_NS, "g");
        g2.setAttribute("transform", "matrix(1 0 0 1 540 540)");
        g2.setAttribute("id", "05f04bf2-f462-40ad-80b7-1b9374547f70");

        svg.appendChild(g2);

        // Create and append the third <g> element with a <circle> inside it
        const g3 = document.createElementNS(SVG_NS, "g");
        g3.setAttribute("transform", "matrix(12.65 0 0 12.65 540 540)");
        g3.setAttribute("id", "2618588e-47a0-410a-8c15-d3a89681704d");

        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("style", "stroke: rgb(0,0,0); stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;");
        circle.setAttribute("vector-effect", "non-scaling-stroke");
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", "0");
        circle.setAttribute("r", "35");

        g3.appendChild(circle);
        svg.appendChild(g3);

        // Create and append the fourth <g> element
        const g4 = document.createElementNS(SVG_NS, "g");
        g4.setAttribute("transform", "matrix(1 0 0 1 540 540)");

        // Create a nested <g> element and append multiple <path> elements inside it
        const g5 = document.createElementNS(SVG_NS, "g");
        g5.setAttribute("style", "");
        g5.setAttribute("vector-effect", "non-scaling-stroke");

        // First path
        const path1 = document.createElementNS(SVG_NS, "path");
        path1.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
        path1.setAttribute("vector-effect", "non-scaling-stroke");
        path1.setAttribute("transform", "translate(-221.02, -221.02)");
        path1.setAttribute("d", "M 221.02 341.304 C 171.312 341.304 117.81400000000001 321.864 66.31 285.08399999999995 C 27.808 257.59 4.044 230.351 3.051 229.203 C -1.0169999999999995 224.506 -1.0169999999999995 217.534 3.051 212.836 C 4.0440000000000005 211.69000000000003 27.807000000000002 184.449 66.31 156.955 C 117.815 120.17800000000001 171.313 100.73600000000002 221.02 100.73600000000002 C 270.728 100.73600000000002 324.227 120.17700000000002 375.73 156.955 C 414.232 184.449 437.99600000000004 211.68900000000002 438.98900000000003 212.836 C 443.057 217.53300000000002 443.057 224.50500000000002 438.98900000000003 229.203 C 437.99600000000004 230.349 414.23300000000006 257.59000000000003 375.73 285.084 C 324.227 321.863 270.729 341.304 221.02 341.304 z M 29.638 221.021 C 39.248000000000005 230.82 57.385000000000005 248.051 81.33200000000001 265.092 C 114.162 288.453 165.046 316.304 221.01999999999998 316.304 C 276.99399999999997 316.304 327.87899999999996 288.453 360.70799999999997 265.092 C 384.652 248.05399999999997 402.78999999999996 230.82099999999997 412.402 221.021 C 402.793 211.22199999999998 384.655 193.99099999999999 360.70799999999997 176.95 C 327.87899999999996 153.588 276.99399999999997 125.73799999999999 221.01999999999998 125.73799999999999 C 165.046 125.73799999999999 114.16199999999998 153.588 81.332 176.95 C 57.388 193.988 39.25 211.219 29.638 221.021 z");
        path1.setAttribute("stroke-linecap", "round");
        g5.appendChild(path1);

        // Second path
        const path2 = document.createElementNS(SVG_NS, "path");
        path2.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
        path2.setAttribute("vector-effect", "non-scaling-stroke");
        path2.setAttribute("transform", "translate(-221.02, -221.02)");
        path2.setAttribute("d", "M 221.02 298.521 C 178.286 298.521 143.52 263.754 143.52 221.02100000000002 C 143.52 178.288 178.286 143.52100000000002 221.02 143.52100000000002 C 239.81400000000002 143.52100000000002 257.944 150.335 272.068 162.709 C 277.26099999999997 167.258 277.78299999999996 175.155 273.234 180.348 C 268.685 185.54100000000003 260.787 186.062 255.59499999999997 181.514 C 246.03099999999998 173.13500000000002 233.75099999999998 168.52100000000002 221.01899999999998 168.52100000000002 C 192.06999999999996 168.52100000000002 168.51899999999998 192.073 168.51899999999998 221.02100000000002 C 168.51899999999998 249.96900000000002 192.06999999999996 273.521 221.01899999999998 273.521 C 249.96899999999997 273.521 273.519 249.96900000000002 273.519 221.02100000000002 C 273.519 214.11800000000002 279.116 208.52100000000002 286.019 208.52100000000002 C 292.922 208.52100000000002 298.519 214.11800000000002 298.519 221.02100000000002 C 298.521 263.754 263.754 298.521 221.02 298.521 z");
        path2.setAttribute("stroke-linecap", "round");
        g5.appendChild(path2);

        // Third path
        const path3 = document.createElementNS(SVG_NS, "path");
        path3.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
        path3.setAttribute("vector-effect", "non-scaling-stroke");
        path3.setAttribute("transform", "translate(-221.02, -221.02)");
        path3.setAttribute("d", "M 221.02 246.021 C 207.235 246.021 196.02 234.80599999999998 196.02 221.021 C 196.02 207.236 207.235 196.021 221.02 196.021 C 234.806 196.021 246.02 207.236 246.02 221.021 C 246.02 234.80599999999998 234.806 246.021 221.02 246.021 z");
        path3.setAttribute("stroke-linecap", "round");
        g5.appendChild(path3);

        // Append the nested <g> to the fourth <g>
        g4.appendChild(g5);

        // Append the fourth <g> to the SVG
        svg.appendChild(g4);

        return svg
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
                }

                this.AdnoAnnotorious.fitBounds(annotation.id)

                let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

                this.setState({ currentID: annotationIndex })
                this.props.changeSelectedAnno(annotation)
            });

            // Generate dataURI and load annotations into Annotorious
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)
        }

        addEventListener('fullscreenchange', this.updateFullScreenEvent);
        addEventListener('keydown', this.keyPressedEvents)
    }

    freeMode = () => {
        const annos = [...document.getElementsByClassName("a9s-annotation")]

        annos.map(anno => {
            const svgElement = this.getEye()

            const tileSize = document.getElementById('adno-osd').clientWidth / 8

            svgElement.setAttribute('width', tileSize);
            svgElement.setAttribute('height', tileSize);

            svgElement.style.fill = "#000"
            svgElement.style.stroke = "#000"
            svgElement.style.strokeWidth = 2
            svgElement.classList.add('a9s-annotation--show')

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

            [...anno.children].map(r => {
                r.classList.add("a9s-annotation--hidden")
            })
        })
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

            if (this.state.isAnnotationsVisible) {
                this.AdnoAnnotorious.selectAnnotation(annotation.id)
                this.AdnoAnnotorious.fitBounds(annotation.id)
            } else {
                if (annotation.target && annotation.target.selector.value) {
                    var imgWithTiles = this.openSeadragon.world.getItemAt(0);
                    var xywh = annotation.target.selector.value.replace("xywh=pixel:", "").split(",")
                    var rect = new OpenSeadragon.Rect(parseFloat(xywh[0]), parseFloat(xywh[1]), parseFloat(xywh[2]), parseFloat(xywh[3]))
                    var imgRect = imgWithTiles.imageToViewportRectangle(rect);
                    this.openSeadragon.viewport.fitBounds(imgRect);
                }
            }

            let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

            this.setState({ currentID: annotationIndex })

            if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
        }

        // Check if the user toggled the navigator on/off
        if (this.props.showNavigator !== prevProps.showNavigator) {
            if (this.props.showNavigator) {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'block';
            } else {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'none';
            }

        }
    }

    toggleFreeMode = () => {
        if (!this.state.freeMode) {
            this.AdnoAnnotorious.clearAnnotations()
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)
        } else {
            this.freeMode()
        }

        this.setState({ freeMode: !this.state.freeMode })
    }

    toggleAnnotationsLayer = () => {
        this.AdnoAnnotorious.setVisible(!this.state.isAnnotationsVisible)
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
                                <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.toggle_annotations')}>
                                        <FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg" />
                                    </div>
                                </button>

                                <button id="set-visible" className="toolbarButton toolbaractive" onClick={this.toggleFreeMode}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.toggle_annotations')}>
                                         <FontAwesomeIcon icon={faVectorSquare} size="lg" />
                                    </div>
                                </button>

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
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter(OpenView));