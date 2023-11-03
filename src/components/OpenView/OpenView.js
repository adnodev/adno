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


// Import Wikidata SDK
import WBK from "wikibase-sdk"

// Import Markdown Reader
import ReactMarkdown from "react-markdown";

// Infinite Loader
import { InfinitySpin } from 'react-loader-spinner'

class OpenView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentID: -1,
            timer: false,
            intervalID: 0,
            fullScreenEnabled: false,
            isAnnotationsVisible: true,
            currentAnnoFsBody: "",
            currentAnnoLoading: false,
            buildingBody: ""
        }
    }

    async componentDidMount() {
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
            // Clear the current annotation text
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

    async componentDidUpdate(prevProps, prevState) {
        // check when there is a new selected annotation from the sidebar
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
            this.setState({ currentAnnoLoading: true })
            await this.getAnnoBody(this.props.selectedAnno)
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


    applyWikiContent = async (wbk, line) => {
        var buildingBody = this.state.buildingBody

        if (line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")) {

            const element = line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")[0];
            var wikiBody = "";

            const wikiID = element.replace('https://www.wikidata.org/wiki/', '')

            const url = wbk.getEntities({
                ids: [wikiID],
                language: ['fr']
            })

            const { entities } = await fetch(url).then(res => res.json())

            const wikiName = `[${entities[wikiID].labels.fr.value}](${element})`;
            const wikiDesc = entities[wikiID].descriptions.fr.value;

            let images = entities[wikiID] && entities[wikiID].claims["P18"]

            buildingBody += "\n" + wikiName + "\n"
            buildingBody += wikiDesc + "\n"

            if (images) {
                const imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=200`
                buildingBody += `![${wikiName}](${new URL(imgUrl)})`
            }

            if (line.match(/\[([^\[]+)\](\(.*\))/gm)) {
                buildingBody += line.replace(/\[([^\[]+)\](\(.*\))/gm, wikiBody)
            } else {
                const regex = new RegExp("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")
                buildingBody += line.replace(regex, wikiBody)
            }

            this.setState({ buildingBody })
        } else {
            buildingBody += line
            this.setState({ buildingBody })
        }
    }

    getAnnoBody = async (annotation) => {
        const wbk = WBK({
            instance: 'https://www.wikidata.org',
            sparqlEndpoint: 'https://query.wikidata.org/sparql'
        })

        if (annotation.body && annotation.body.length > 0) {
            var annoMdBody = annotation.body[0].value

            const allLines = annoMdBody.split("\n")

            for (const line of allLines) {
                if (line !== "") {
                    await this.applyWikiContent(wbk, line);
                }
            }
        }

        this.setState({
            currentAnnoFsBody: this.state.buildingBody,
            currentAnnoLoading: false,
            buildingBody: ""
        })
    }

    getAnnotationHTMLBody = async (annotation) => {
        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return (
                    <div className={this.props.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>

                        { ReactHtmlParser(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)}
                    </div>
                )
            }
        }
    }





    render() {
        return (
            <div id="adno-osd">

                {
                    this.state.fullScreenEnabled && this.props.selectedAnno && this.props.selectedAnno.body &&
                    //this.getAnnotationHTMLBody(this.props.selectedAnno)

                    <div className={this.props.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>
                        {
                            this.state.currentAnnoLoading ?
                                <InfinitySpin
                                    width='200'
                                    height="200"
                                    color="black"
                                />
                                :
                                <ReactMarkdown children={this.state.currentAnnoFsBody} />
                        }
                    </div>
                }


                <div className={this.props.showToolbar ? "toolbar-on" : "toolbar-off"}>
                    <div className={this.state.fullScreenEnabled && this.props.toolsbarOnFs ? "osd-buttons-bar" : this.state.fullScreenEnabled && !this.props.toolsbarOnFs ? "osd-buttons-bar-hidden" : "osd-buttons-bar"}>

                        {
                            this.props.annos.length > 0 &&
                            <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}><FontAwesomeIcon icon={this.state.timer ? faPause : faPlay} size="lg" /></button>
                        }

                        <button id="home-button" className="toolbarButton toolbaractive"><FontAwesomeIcon icon={faMagnifyingGlassMinus} size="lg" /></button>

                        {
                            this.props.annos.length > 0 &&
                            <>
                                <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}><FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg" /></button>

                                <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}><FontAwesomeIcon icon={faArrowLeft} size="lg" /></button>
                                <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}><FontAwesomeIcon icon={faArrowRight} size="lg" /></button>

                            </>
                        }

                        {
                            this.props.rotation &&
                            <button id="rotate" className="toolbarButton toolbaractive" onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees + 90)}><FontAwesomeIcon icon={faRotateRight} size="lg" /></button>
                        }
                        <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}><FontAwesomeIcon icon={faExpand} size="lg" /></button>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(OpenView);