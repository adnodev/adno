import { Component } from "react";
import { withRouter } from "react-router-dom";
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight } from "@fortawesome/free-solid-svg-icons";


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
            eyes: []
        }
    }

    getEye() {
        // Define the SVG namespace
        const SVG_NS = "http://www.w3.org/2000/svg";

        // Create the main SVG element
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("xmlns", SVG_NS);
        svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("width", "1080");
        svg.setAttribute("height", "1080");
        svg.setAttribute("viewBox", "0 0 1080 1080");
        svg.setAttribute("xml:space", "preserve");

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
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/'
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


            setTimeout(() => {
                const annos = [...document.getElementsByClassName("a9s-annotation")]

                annos.map(anno => {
                    // const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    // svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    // svgElement.setAttribute('viewBox', '0 0 24 24');

                    // const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path1.setAttribute('d', "M14 2.75C15.9068 2.75 17.2615 2.75159 18.2892 2.88976C19.2952 3.02503 19.8749 3.27869 20.2981 3.7019C20.7852 4.18904 20.9973 4.56666 21.1147 5.23984C21.2471 5.9986 21.25 7.08092 21.25 9C21.25 9.41422 21.5858 9.75 22 9.75C22.4142 9.75 22.75 9.41422 22.75 9L22.75 8.90369C22.7501 7.1045 22.7501 5.88571 22.5924 4.98199C22.417 3.97665 22.0432 3.32568 21.3588 2.64124C20.6104 1.89288 19.6615 1.56076 18.489 1.40314C17.3498 1.24997 15.8942 1.24998 14.0564 1.25H14C13.5858 1.25 13.25 1.58579 13.25 2C13.25 2.41421 13.5858 2.75 14 2.75Z")

                    // const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path2.setAttribute('d', "M2.00001 14.25C2.41422 14.25 2.75001 14.5858 2.75001 15C2.75001 16.9191 2.75289 18.0014 2.88529 18.7602C3.00275 19.4333 3.21477 19.811 3.70191 20.2981C4.12512 20.7213 4.70476 20.975 5.71085 21.1102C6.73852 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.6502 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64125 21.3588C1.95681 20.6743 1.58304 20.0233 1.40762 19.018C1.24992 18.1143 1.24995 16.8955 1.25 15.0964L1.25001 15C1.25001 14.5858 1.58579 14.25 2.00001 14.25Z")

                    // const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path3.setAttribute('d', "M22 14.25C22.4142 14.25 22.75 14.5858 22.75 15L22.75 15.0963C22.7501 16.8955 22.7501 18.1143 22.5924 19.018C22.417 20.0233 22.0432 20.6743 21.3588 21.3588C20.6104 22.1071 19.6615 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7852 19.811 20.9973 19.4333 21.1147 18.7602C21.2471 18.0014 21.25 16.9191 21.25 15C21.25 14.5858 21.5858 14.25 22 14.25Z")

                    // const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path4.setAttribute('d', "M9.94359 1.25H10C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09319 2.75 6.73852 2.75159 5.71085 2.88976C4.70476 3.02503 4.12512 3.27869 3.70191 3.7019C3.21477 4.18904 3.00275 4.56666 2.88529 5.23984C2.75289 5.9986 2.75001 7.08092 2.75001 9C2.75001 9.41422 2.41422 9.75 2.00001 9.75C1.58579 9.75 1.25001 9.41422 1.25001 9L1.25 8.90369C1.24995 7.10453 1.24992 5.8857 1.40762 4.98199C1.58304 3.97665 1.95681 3.32568 2.64125 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10584 1.24998 9.94359 1.25Z")

                    // const path5 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path5.setAttribute('d', "M12 10.75C11.3096 10.75 10.75 11.3096 10.75 12C10.75 12.6904 11.3096 13.25 12 13.25C12.6904 13.25 13.25 12.6904 13.25 12C13.25 11.3096 12.6904 10.75 12 10.75Z")


                    // const path6 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // path6.setAttribute('fill-rule', 'evenodd');
                    // path6.setAttribute('d', 'M5.89243 14.0598C5.29748 13.3697 5.00001 13.0246 5.00001 12C5.00001 10.9754 5.29748 10.6303 5.89243 9.94021C7.08038 8.56223 9.07269 7 12 7C14.9273 7 16.9196 8.56222 18.1076 9.94021C18.7025 10.6303 19 10.9754 19 12C19 13.0246 18.7025 13.3697 18.1076 14.0598C16.9196 15.4378 14.9273 17 12 17C9.07269 17 7.08038 15.4378 5.89243 14.0598ZM9.25001 12C9.25001 10.4812 10.4812 9.25 12 9.25C13.5188 9.25 14.75 10.4812 14.75 12C14.75 13.5188 13.5188 14.75 12 14.75C10.4812 14.75 9.25001 13.5188 9.25001 12Z');
                    // path6.setAttribute('clip-rule', 'evenodd');


                    // svgElement.appendChild(path1);
                    // svgElement.appendChild(path2);
                    // svgElement.appendChild(path3);
                    // svgElement.appendChild(path4);
                    // svgElement.appendChild(path5);
                    // svgElement.appendChild(path6);
                    const svgElement = this.getEye()

                    svgElement.setAttribute('width', '200');
                    svgElement.setAttribute('height', '200');

                    svgElement.style.fill = "#000"
                    svgElement.style.stroke = "#000"
                    svgElement.style.strokeWidth = 2
                    svgElement.classList.add('a9s-annotation--show')

                    const type = [...anno.children][0].tagName

                    // "ellipse"
                    // "rect"
                    // "path"
                    // "polygon"
                    // "circle"
                    if (type === "ellipse" || type == "circle") {
                        svgElement.setAttribute('x', anno.children[0].getAttribute("cx") - 100 + 32);
                        svgElement.setAttribute('y', anno.children[0].getAttribute("cy") - 100 + 25);

                        if (anno.classList.contains("a9s-point")) {
                            anno.removeAttribute("transform", "")

                            anno.classList.remove("a9s-point")
                            anno.classList.remove("a9s-non-scaling")
                        }

                        anno.appendChild(svgElement)
                    } else if (type === "rect") {
                        svgElement.setAttribute('x', anno.children[0].getAttribute("x") - 100 + anno.children[0].getAttribute("width") / 2 + 32);
                        svgElement.setAttribute('y', anno.children[0].getAttribute("y") - 100 + anno.children[0].getAttribute("height") / 2 + 25);

                        anno.appendChild(svgElement)
                    } else if (type === "path" || type === "polygon") {
                        const bbox = anno.getBBox();

                        const centerX = bbox.x + bbox.width / 2;
                        const centerY = bbox.y + bbox.height / 2;

                        svgElement.setAttribute('x', centerX - 100 + 32);
                        svgElement.setAttribute('y', centerY - 100 + 25);

                        anno.appendChild(svgElement)
                    }


                    [...anno.children].map(r => r.classList.add("a9s-annotation--hidden"))
                })
            }, 500)

        }

        addEventListener('fullscreenchange', this.updateFullScreenEvent);
        addEventListener('keydown', this.keyPressedEvents)
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
                {this.state.eyes.map(({ top, left }) => {
                    return <div style={{
                        position: 'absolute',
                        top: top * document.getElementById('adno-osd').clientHeight + 40,
                        left: left * document.getElementById('adno-osd').clientWidth - 20,
                        height: 32,
                        width: 32,
                        background: 'red',
                        zIndex: 100
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                            <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                        </svg>

                    </div>
                })}

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