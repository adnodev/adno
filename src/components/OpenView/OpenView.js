import { Component } from "react";
import { withRouter } from "react-router-dom";
import Swal from "sweetalert2";
import "./OpenView.css";
import ReactHtmlParser from 'react-html-parser';

// Import utils
import { checkIfProjectExists } from "../../Utils/utils";

// Import libraries
// import "../../libraries/annona-reworked/js/storyboard";
import "../../libraries/openseadragon/openseadragon-annotorious.min.js";

class OpenView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentID: -1,
            timer: false,
            intervalID: 0,
            timerDelay: -1,
            fullScreenEnabled: false
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
                // showNavigationControl: false,
                showNavigator: true,
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

            this.AdnoAnnotorious.on('clickAnnotation', (annotation, element) => {
                document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

                this.AdnoAnnotorious.fitBounds(annotation.id)

                let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

                this.setState({ currentID: annotationIndex })
                this.props.changeSelectedAnno(annotation)
            });



            // Generate dataURI and load annotations into Annotorious
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)
        }


        addEventListener('fullscreenchange', (event) => {
            // turn off fullscreen
            if (!document.fullscreenElement) {
                this.setState({ fullScreenEnabled: false })
            }
        });

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
        this.props.changeSelectedAnno(annotation)

        this.AdnoAnnotorious.selectAnnotation(annotation.id)
        this.AdnoAnnotorious.fitBounds(annotation.id)

        let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

        this.setState({ currentID: annotationIndex })

        document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }


    startTimer = () => {
        if (this.state.timer) {
            this.setState({ timer: false })

            clearInterval(this.state.intervalID)
        } else {
            if (this.state.timerDelay === -1) {
                let delay = prompt("Saisissez le délai (en secondes) entre deux annotations")

                let newTimerDelay = delay || 2

                let interID = setInterval(this.automateLoading, newTimerDelay * 1000);
                this.setState({ timer: true, intervalID: interID, timerDelay: newTimerDelay })
            } else {
                let interID = setInterval(this.automateLoading, this.state.timerDelay * 1000);
                this.setState({ timer: true, intervalID: interID })
            }
        }
    }

    previousAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.state.currentID === -1 || this.state.currentID === 0) {
            localCurrentID = this.props.annos.length - 1
        } else {
            localCurrentID = this.state.currentID - 1
        }

        this.setState({ currentID: localCurrentID })

        this.changeAnno(this.props.annos[localCurrentID])

        document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    }

    nextAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.state.currentID === -1 || this.state.currentID === this.props.annos.length - 1) {
            localCurrentID = 0
        } else {
            localCurrentID++;
        }

        this.setState({ currentID: localCurrentID })

        this.changeAnno(this.props.annos[localCurrentID])
        document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    enableFullScreen = () => {
        // turn on full screen
        if (!this.state.fullScreenEnabled) {
            document.getElementById("adno-osd").requestFullscreen();
            this.setState({ fullScreenEnabled: true })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // check when there is a new selected annotation from the sidebar
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
        }
    }

    render() {
        return (
            <div id="adno-osd">

                {
                    this.state.fullScreenEnabled && this.props.selectedAnno && this.props.selectedAnno.body &&
                    <div className="adno-osd-anno-fullscreen">
                        {this.props.selectedAnno.body && this.props.selectedAnno.body[0] &&
                            this.props.selectedAnno.body[0].value
                            ? ReactHtmlParser(this.props.selectedAnno.body[0].value) : "Annotation vide"}
                    </div>
                }


                <div className={this.state.fullScreenEnabled ? "osd-buttons-bar-hidden" : "osd-buttons-bar"}>
                    {
                        this.state.timerDelay !== - 1 &&
                        <span className="toolbarButton toolbaractive" ><i className="fa fa-clock"></i>{this.state.timerDelay}</span>
                    }
                    {/* <input type="text" placeholder="Nombre de secondes" value={this.state.timerDelay} onChange={(e) => this.setState({ timerDelay: e.target.value })} /> */}
                    <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}><i className={this.state.timer ? "fa fa-pause" : "fa fa-play"}></i></button>
                    <button id="home-button" className="toolbarButton toolbaractive"><i className="fa fa-home"></i></button>
                    <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}><i className="fa fa-arrow-left"></i></button>
                    <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}><i className="fa fa-arrow-right"></i></button>
                    <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.enableFullScreen()}><i className="fa fa-expand"></i></button>
                </div>
            </div>
        )
    }
}

export default withRouter(OpenView);