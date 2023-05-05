import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withRouter } from "react-router";
import { defaultProjectSettings, get_url_extension } from "../../Utils/utils";
import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import ReactHtmlParser from 'react-html-parser';
import Swal from "sweetalert2";
import { withTranslation } from "react-i18next";

class AdnoEmbed extends Component {
    constructor(props) {
        super(props)
        this.state = {
            annos: [],
            timerDelay: 3,
            currentID: -1,
            intervalID: 0,
            fullScreenEnabled: false,
            isAnnotationsVisible: false,
            toolsbarOnFs: false,
            selectedAnno: {},
            settings: defaultProjectSettings(),
            isLoaded: false
        }
    }

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search);
        const adnoProjectURL = query.get('url')

        this.getAdnoProject(adnoProjectURL)
    }

    displayViewer = (tileSources, annos) => {

        this.openSeadragon = OpenSeadragon({
            id: 'adno-osd',
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

        this.AdnoAnnotorious.setVisible(false);

        this.AdnoAnnotorious.on('clickAnnotation', (annotation) => {

            if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }

            this.AdnoAnnotorious.fitBounds(annotation.id)

            let annotationIndex = this.state.annos.findIndex(anno => anno.id === annotation.id)

            this.setState({ currentID: annotationIndex, selectedAnnotation: annotation })
        });


        // Generate dataURI and load annotations into Annotorious
        const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(annos))));
        this.AdnoAnnotorious.loadAnnotations(dataURI)
    }


    toggleAnnotationsLayer = () => {
        this.AdnoAnnotorious.setVisible(!this.state.isAnnotationsVisible)
        this.setState({ isAnnotationsVisible: !this.state.isAnnotationsVisible })
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
        if (!this.state.fullScreenEnabled) {
            document.getElementById("adno-osd").requestFullscreen();
            this.setState({ fullScreenEnabled: true })
        } else {
            document.exitFullscreen();
            this.setState({ fullScreenEnabled: false })
        }
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
                // Call the function to go to the next annotation every "timerDelay" seconds
                let interID = setInterval(this.automateLoading, this.state.timerDelay * 1000);
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

    changeAnno = (annotation) => {
        if (annotation && annotation.id) {
            this.setState({ selectedAnno: annotation })

            if (this.state.isAnnotationsVisible) {
                this.AdnoAnnotorious.selectAnnotation(annotation.id)
                this.AdnoAnnotorious.fitBounds(annotation.id)
            }

            let annotationIndex = this.state.annos.findIndex(anno => anno.id === annotation.id)

            this.setState({ currentID: annotationIndex })
        }
    }


    getAdnoProject = (url) => {
        // We check if the url contains an image
        if (get_url_extension(url) === "png" || get_url_extension(url) === "jpg" || get_url_extension(url) === "jpeg") {
            fetch(url)
                .then(res => {
                    if (res.status == 200 || res.status == 201) {

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

                        console.log("manifest : ", imported_project);

                        if (imported_project.hasOwnProperty("format") && imported_project.format === "Adno") {
                            console.log("projet adno");


                            if (imported_project.hasOwnProperty("@context")
                                && imported_project.hasOwnProperty("date")
                                && imported_project.hasOwnProperty("id")
                                && (imported_project.hasOwnProperty("title") || imported_project.hasOwnProperty("label"))
                                && imported_project.hasOwnProperty("type")
                                && imported_project.hasOwnProperty("modified")
                                && imported_project.hasOwnProperty("source")
                                && imported_project.hasOwnProperty("total")
                            ) {
                                console.log("projet VALIDE");


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



                                const tileSources = (get_url_extension(imported_project.source) === "png" || get_url_extension(imported_project.source) === "jpg" || get_url_extension(imported_project.source) === "jpeg") ?
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
                            console.log("pas adno");

                            // Check if it's a manifest

                            if (
                                (imported_project.hasOwnProperty("id") || imported_project.hasOwnProperty("@id"))
                                && (imported_project.hasOwnProperty("context") || imported_project.hasOwnProperty("@context"))
                            ) {
                                console.log("projet NON-adno mais VALIDe");

                                if (imported_project["@type"] && imported_project["@type"] === "sc:Manifest") {
                                    // type manifest

                                    console.log("type manifest");

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
                                }




                                if (resultLink) {

                                    console.log(resultLink);

                                    var annos = [];

                                    // if(imported_project.sequences[0].canvases[0].annotationList.resources){
                                    //     annos = imported_project.sequences[0].canvases[0].annotationList.resources;
                                    // }else if (){

                                    // }

                                    console.log(imported_project.sequences[0].canvases[0].annotationList.resources);

                                    const tileSources = (get_url_extension(resultLink) === "png" || get_url_extension(resultLink) === "jpg" || get_url_extension(resultLink) === "jpeg") ?
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

                        console.log(imported_project.hasOwnProperty("@context"))
                        console.log(imported_project.hasOwnProperty("date"))
                        console.log(imported_project.hasOwnProperty("id"))
                        console.log((imported_project.hasOwnProperty("title") || imported_project.hasOwnProperty("label")))
                        console.log(imported_project.hasOwnProperty("type"))
                        console.log(imported_project.hasOwnProperty("modified"))
                        console.log(imported_project.hasOwnProperty("source"))
                        console.log(imported_project.hasOwnProperty("total"))

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
                <div id="adno-osd">

                    {
                        this.state.selectedAnno && this.state.selectedAnno.body &&
                        this.getAnnotationHTMLBody(this.state.selectedAnno)
                    }

                    <div className={"toolbar-on"}>
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

                            <button id="rotate" className="toolbarButton toolbaractive" onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees + 90)}><FontAwesomeIcon icon={faRotateRight} size="lg" /></button>
                            <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}><FontAwesomeIcon icon={faExpand} size="lg" /></button>
                        </div>
                    </div>
                </div>
            )
        } else {
            return (<></>)
        }

    }
}

export default withTranslation()(withRouter(AdnoEmbed));