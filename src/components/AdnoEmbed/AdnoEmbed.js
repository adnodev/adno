import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withRouter } from "react-router";
import { get_url_extension } from "../../Utils/utils";
import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import ReactHtmlParser from 'react-html-parser';
import Swal from "sweetalert2";
import { withTranslation } from "react-i18next";

// Import Wikidata SDK
import WBK from "wikibase-sdk"

// Import Markdown Reader
import ReactMarkdown from "react-markdown";

// Infinite Loader
import { InfinitySpin } from 'react-loader-spinner'

// Import Style
import "./AdnoEmbed.css";

class AdnoEmbed extends Component {
    constructor(props) {
        super(props)
        this.state = {
            annos: [],
            currentID: -1,
            intervalID: 0,
            selectedAnno: {},
            isLoaded: false,
            currentAnnoFsBody: "",
            currentAnnoLoading: false,
            buildingBody: ""
        }
    }

    overrideSettings = () => {
        const query = new URLSearchParams(this.props.location.search);

        // Add default delay of 3 seconds
        var delay = 3;

        // Check if the user setted a delay in the url settings
        if (query.get("delay")) {
            const timerDelay = Number.parseInt(query.get("delay"))
            if (delay >= 1 && delay <= 20) {
                delay = timerDelay
            }
        }

        var showNavigator = query.get("navigator") ? query.get("navigator") === "true" : true;
        var toolsbarOnFs = query.get("toolbarsfs") ? query.get("toolbarsfs") === "true" : true;
        var startbyfirstanno = query.get("startfirst") ? query.get("startfirst") === "true" : false;
        var rotation = query.get("rotation") ? query.get("rotation") === "true" : false;
        var showToolbar = query.get("toolbar") ? query.get("toolbar") === "true" : true;
        var isAnnotationsVisible = query.get("anno_bounds") ? query.get("anno_bounds") === "true" : false;

        const settings = {
            delay,
            showNavigator,
            toolsbarOnFs,
            sidebarEnabled: true,
            startbyfirstanno,
            rotation,
            isAnnotationsVisible,
            showToolbar
        }
        // Update settings
        this.setState({ ...settings });
    }

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search);
        const adnoProjectURL = query.get('url')

        this.getAdnoProject(adnoProjectURL)

        // Accessibility shortcuts
        addEventListener('fullscreenchange', this.updateFullScreenEvent);
        addEventListener('keydown', this.keyPressedEvents)
    }

    displayViewer = (tileSources, annos) => {

        this.openSeadragon = OpenSeadragon({
            id: 'adno-embed',
            homeButton: "home-button",
            showNavigator: false,
            tileSources: tileSources,
            prefixUrl: 'https://openseadragon.github.io/openseadragon/images/'
        })

        this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
            locale: 'auto',
            drawOnSingleClick: true,
            allowEmpty: true,
            disableEditor: true,
            readOnly: true,
        });

        this.AdnoAnnotorious.setVisible(this.state.isAnnotationsVisible);

        this.AdnoAnnotorious.on('clickAnnotation', (annotation) => {
            if (this.state.isAnnotationsVisible) {
                this.AdnoAnnotorious.fitBounds(annotation.id)

                let annotationIndex = this.state.annos.findIndex(anno => anno.id === annotation.id)

                this.setState({ currentID: annotationIndex, selectedAnno: annotation })
            }
        });

        // Generate dataURI and load annotations into Annotorious
        const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(annos))));
        this.AdnoAnnotorious.loadAnnotations(dataURI)
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

    getAnnotationHTMLBody = (annotation) => {
        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return (
                    <div className={this.state.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>

                        { ReactHtmlParser(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)}
                    </div>
                )
            }
        }
    }

    toggleFullScreen = () => {
        // turn on full screen
        if (document.fullscreenEnabled) {
            if (!this.state.fullScreenEnabled) {
                if (document.getElementById("adno-embed")) {
                    document.getElementById("adno-embed").requestFullscreen();
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
                this.setState({ showToolbar: !this.state.showToolbar })
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



    previousAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.state.annos.length > 0) {

            if (this.state.currentID === -1 || this.state.currentID === 0) {
                localCurrentID = this.state.annos.length - 1
            } else {
                localCurrentID = this.state.currentID - 1
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.state.annos[localCurrentID])

        }
    }

    nextAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.state.annos.length > 0) {
            if (this.state.currentID === -1 || this.state.currentID === this.state.annos.length - 1) {
                localCurrentID = 0
            } else {
                localCurrentID++;
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.state.annos[localCurrentID])
        }
    }

    startTimer = () => {
        // Do not start the timer if there is no content to display
        if (this.state.annos.length > 0) {

            // Check if the timer is already started, clear the auto scroll between annotations
            if (this.state.timer) {
                this.setState({ timer: false })

                clearInterval(this.state.intervalID)
            } else {

                if (this.state.startbyfirstanno) {
                    this.setState({ currentID: -1 })

                    this.changeAnno(this.state.annos[0])
                } else {
                    this.automateLoading()

                }
                // Call the function to go to the next annotation every "delay" seconds
                let interID = setInterval(this.automateLoading, this.state.delay * 1000);
                this.setState({ timer: true, intervalID: interID })
            }
        }
    }
    automateLoading = () => {
        let localCurrentID = this.state.currentID;

        if (this.state.currentID === -1) {
            localCurrentID = 0
        } else if (this.state.currentID === this.state.annos.length - 1) {
            localCurrentID = 0
        } else {
            localCurrentID++;
        }

        this.setState({ currentID: localCurrentID })

        this.changeAnno(this.state.annos[localCurrentID])
    }

    changeAnno = async (annotation) => {
        this.setState({ selectedAnno: annotation })

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

        let annotationIndex = this.state.annos.findIndex(anno => anno.id === annotation.id)

        this.setState({ currentID: annotationIndex, currentAnnoLoading: true, currentAnnoFsBody: "" })

        // this.setState({currentAnnoLoading: true})
        await this.getAnnoBody(annotation)
    }



    getAdnoProject = (url) => {
        const IPFS_GATEWAY = process.env.IPFS_GATEWAY

        const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;

        const GRANTED_IMG_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS.split(",")

        const isIpfsUrl = url.match(regexCID) || url.startsWith(IPFS_GATEWAY);
        if (isIpfsUrl && !url.startsWith(IPFS_GATEWAY)) url = IPFS_GATEWAY + url;

        // We check if the url contains an image
        if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(url)) || isIpfsUrl) {
            fetch(url)
                .then(res => {
                    if (res.status == 200 || res.status == 201) {

                        this.overrideSettings()

                        const tileSources = {
                            type: 'image',
                            url
                        }

                        this.setState({ isLoaded: true })

                        this.displayViewer(tileSources, [])

                    } else {
                        this.setState({ isLoaded: true })
                        throw new Error(this.props.t('errors.unable_access_file'))
                    }
                })
                .catch(err => {
                    Swal.fire({
                        title: err.message,
                        showCancelButton: false,
                        showConfirmButton: false,
                        icon: 'warning',
                    })
                })
        } else {

            // If we don't have a picture

            fetch(url)
                .then(res => {
                    if (res.status == 200 || res.status == 201) {
                        return res.text()
                    } else {
                        throw new Error(this.props.t('errors.unable_access_file'))
                    }
                })
                .then(rawManifest => {
                    try {
                        const imported_project = JSON.parse(rawManifest);

                        // ADNO project detected

                        if (imported_project.hasOwnProperty("format") && imported_project.format === "Adno") {

                            if (imported_project.hasOwnProperty("@context")
                                && imported_project.hasOwnProperty("date")
                                && imported_project.hasOwnProperty("id")
                                && (imported_project.hasOwnProperty("title") || imported_project.hasOwnProperty("label"))
                                && imported_project.hasOwnProperty("type")
                                && imported_project.hasOwnProperty("modified")
                                && imported_project.hasOwnProperty("source")
                                && imported_project.hasOwnProperty("total")
                            ) {

                                // if the project has imported settings, override current settings
                                if (imported_project.hasOwnProperty("adno_settings")) {
                                    this.setState({ ...imported_project.adno_settings });

                                    this.overrideSettings()
                                }

                                this.setState({ isLoaded: true })
                                let annos = [...imported_project.first.items]

                                annos?.forEach(annotation => {
                                    if (annotation.body.find(annoBody => annoBody.type === "TextualBody") && !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
                                        const newBody = annotation.body

                                        newBody.push({
                                            "type": "HTMLBody",
                                            "value": `<p>${annotation.body.filter(annobody => annobody.type === "TextualBody")[0].value}</p>`,
                                            "purpose": "commenting"
                                        })

                                        annos.filter(anno => anno.id === annotation.id)[0].body = newBody
                                    }
                                })


                                const GRANTED_IMG_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS.split(",")

                                const tileSources = (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(imported_project.source))) ?
                                    {
                                        type: 'image',
                                        url: imported_project.source
                                    }
                                    :
                                    [
                                        imported_project.source
                                    ]

                                this.displayViewer(tileSources, annos)

                                // Add annotations to the state
                                this.setState({ annos })

                            } else {
                                Swal.fire({
                                    title: `projet adno INVALIDE`,
                                    showCancelButton: false,
                                    showConfirmButton: false,
                                    icon: 'error',
                                })
                            }

                        } else {
                            // Check if it's a manifest

                            if (
                                (imported_project.hasOwnProperty("id") || imported_project.hasOwnProperty("@id"))
                                && (imported_project.hasOwnProperty("context") || imported_project.hasOwnProperty("@context"))
                            ) {
                                this.overrideSettings()

                                if (imported_project["@type"] && imported_project["@type"] === "sc:Manifest") {
                                    // type manifest

                                    if (imported_project.sequences[0].canvases && imported_project.sequences[0].canvases.length > 0) {
                                        var resultLink = imported_project.sequences[0].canvases[0].images[0].resource.service["@id"] + "/info.json"
                                    } else if (imported_project.logo["@id"]) {
                                        var resultLink = imported_project.logo["@id"].split("/")[0] + "//"

                                        for (let index = 1; index < imported_project.logo["@id"].split("/").length - 4; index++) {
                                            resultLink += imported_project.logo["@id"].split("/")[index] + "/";
                                        }

                                        resultLink += "/info.json"

                                    } else {
                                        Swal.fire({
                                            title: this.props.t('errors.unable_reading_manifest'),
                                            showCancelButton: true,
                                            showConfirmButton: false,
                                            cancelButtonText: 'OK',
                                            icon: 'warning',
                                        })
                                    }
                                } else {
                                    resultLink = url
                                }


                                if (resultLink) {

                                    var annos = [];

                                    const GRANTED_IMG_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS.split(",")

                                    const tileSources = (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(resultLink))) ?
                                        {
                                            type: 'image',
                                            url: resultLink
                                        }
                                        :
                                        [
                                            resultLink
                                        ]



                                    this.setState({ isLoaded: true })

                                    // Add annotations to the state
                                    this.setState({ annos })
                                    this.displayViewer(tileSources, annos)
                                }




                            } else {
                                console.log("projet non adno INVALIDE");

                            }

                        }

                    } catch (error) {
                        console.error(error.message);
                        Swal.fire({
                            title: `Impossible de parser le json`,
                            showCancelButton: false,
                            showConfirmButton: false,
                            icon: 'warning',
                        })
                    }

                })
                .catch(() => {
                    Swal.fire({
                        title: this.props.t('errors.wrong_url'),
                        showCancelButton: false,
                        showConfirmButton: false,
                        icon: 'warning',
                    })
                })
        }
    }

    render() {
        if (this.state.isLoaded) {
            return (
                <div id="adno-embed">
                    {/* 
                    {
                        this.state.selectedAnno && this.state.selectedAnno.body &&
                        this.getAnnotationHTMLBody(this.state.selectedAnno)
                    } */}

                    {
                        this.state.currentAnnoLoading ?
                            <div className={this.state.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>
                                <InfinitySpin
                                    width='200'
                                    height="200"
                                    color="black"
                                />
                            </div>

                            : this.state.currentAnnoFsBody && this.state.currentAnnoFsBody !== "" &&
                            <div className={this.state.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>
                                <ReactMarkdown children={this.state.currentAnnoFsBody} />
                            </div>
                    }



                    <div className={this.state.showToolbar ? "toolbar-on" : "toolbar-off"}>
                        <div className={"osd-buttons-bar"}>

                            {
                                this.state.annos.length > 0 &&
                                <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}><FontAwesomeIcon icon={this.state.timer ? faPause : faPlay} size="lg" /></button>
                            }

                            <button id="home-button" className="toolbarButton toolbaractive"><FontAwesomeIcon icon={faMagnifyingGlassMinus} size="lg" /></button>


                            {
                                this.state.annos.length > 0 &&
                                <>
                                    <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}><FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg" /></button>

                                    <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}><FontAwesomeIcon icon={faArrowLeft} size="lg" /></button>
                                    <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}><FontAwesomeIcon icon={faArrowRight} size="lg" /></button>
                                </>
                            }

                            {
                                this.state.rotation &&
                                <button id="rotate" className="toolbarButton toolbaractive" onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees + 90)}><FontAwesomeIcon icon={faRotateRight} size="lg" /></button>
                            }
                            <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}><FontAwesomeIcon icon={faExpand} size="lg" /></button>
                        </div>
                    </div>
                </div>
            )
        } else {
            return null;
        }

    }
}

export default withTranslation()(withRouter(AdnoEmbed));