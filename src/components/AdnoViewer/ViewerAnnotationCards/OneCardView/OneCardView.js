import { Component } from "react";

// Import Utils
import { buildTagsList, generateUUID } from "../../../../Utils/utils";

// Import Html Parser
import parse from 'html-react-parser';

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlusCircle, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";

// Add translations
import { withTranslation } from "react-i18next";

class OneCardView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            fullView: false,
            url: "",
            annoBody: this.props.annotation.body[0] && this.props.annotation.body[0].value && parse(this.props.annotation.body[0].value)
        }
    }

    // componentDidMount() {
    //     this.buildExternalLink()
    // }

    getAnnotationHTMLBody = () => {
        let annotation = this.props.annotation

        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return parse(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)
            } else {
                return <span className="no-content">Ø {this.props.t('annotation.no_content')}</span>
            }
        } else {
            return <span className="no-content">Ø {this.props.t('annotation.no_content')}</span>
        }
    }

    buildExternalLink = () => {
        if (this.props.annotation.target.selector.type === "FragmentSelector" && this.props.project.manifest_url) {

            let coordinates = this.props.annotation.target.selector.value.replace("xywh=pixel:", "")

            let coord_left = Math.round(coordinates.split(",")[0])
            let coord_top = Math.round(coordinates.split(",")[1])
            let coord_width = Math.round(coordinates.split(",")[2])
            let coord_height = Math.round(coordinates.split(",")[3])

            let newCoordinates = `${coord_left},${coord_top},${coord_width},${coord_height}`

            let url_full = `${this.props.annotation.target.source}/${newCoordinates}/full/0/default.jpg`
            let url_max = `${this.props.annotation.target.source}/${newCoordinates}/max/0/default.jpg`

            fetch(url_full)
                .then(res => {
                    if (res.ok) {
                        this.setState({ url: url_full })
                    } else {
                        fetch(url_max)
                            .then(res => {
                                if (res.ok) {
                                    this.setState({ url: url_max })
                                }
                            })
                    }
                })
                .catch(() => {
                    fetch(url_max)
                        .then(res => {
                            if (res.ok) {
                                this.setState({ url: url_max })
                            }
                        })
                })
        }
    }

    hasAudio = annotation => {
        if (Array.isArray(annotation.body) && annotation.body.length > 0) {
            const resource = annotation.body
                .find(body => body.type === "SpecificResource")
            return resource?.source?.id
        }
        return false
    }

    render() {
        return (
            <div className="anno-card-body">
                {/* <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(this.props.annotation)} </h6> */}
                {this.hasAudio(this.props.annotation) && <FontAwesomeIcon icon={faVolumeHigh} />}

                <div className="card-tags-list">
                    {
                        buildTagsList(this.props.annotation).map(tag => {
                            return (
                                <div key={generateUUID()} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                                    {tag.value}
                                </div>
                            )
                        })
                    }
                </div>

                <div className={this.props.selectedAnno && this.props.selectedAnno.id === this.props.annotation.id ? "adno-card-selected-body" : "adno-card-body"}>
                    {this.getAnnotationHTMLBody()}
                </div>


                <div className="btn-line-one-card">

                    {this.state.annoBody && <button type="button" className="btn btn-outline btn-sm btn-show-more bg-white"
                        onClick={() => this.props.openFullAnnotationView(this.props.annotation)}>
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.read_more')}>
                            <FontAwesomeIcon icon={faPlusCircle} />
                        </div>
                    </button>}

                    <button type="button"
                        onClick={() => this.props.clickOnTarget(this.props.annotation)}
                        className="btn btn-outline btn-sm btn-show-more bg-white">
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.target')}>
                            <FontAwesomeIcon icon={faBullseye} />
                        </div>
                    </button>

                    {/* Afficher la redirection vers la zone de l'annotation */}
                    {/* {this.state.url && <a href={this.state.url} className="btn btn-outline btn-success btn-sm btn-show-more" target="_blank"> <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>} */}
                </div>
            </div >
        )
    }
}
export default withTranslation()(OneCardView);
