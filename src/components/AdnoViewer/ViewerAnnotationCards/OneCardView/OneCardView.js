import { Component } from "react";

// Import Utils
import { buildTagsList, generateUUID } from "../../../../Utils/utils";
import ReactHtmlParser from 'react-html-parser';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

class OneCardView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fullView: false,
            url: "",
            annoBody: this.props.annotation.body[0] && this.props.annotation.body[0].value && ReactHtmlParser(this.props.annotation.body[0].value)[0]
        }
    }

    // componentDidMount() {
    //     this.buildExternalLink()
    // }

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

    render() {
        return (
            <div className="anno-card-body">
                {/* <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(this.props.annotation)} </h6> */}

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

                <div className="adno-card-body">
                    <p>{this.state.annoBody || "Annotation vide"}</p>
                </div>


                <div className="btn-line-one-card">

                    {this.state.annoBody && <button type="button" className="btn btn-outline btn-info btn-sm btn-show-more" onClick={() => this.props.openFullAnnotationView(this.props.annotation)}> Voir <FontAwesomeIcon icon={faPlusCircle} /></button>}

                    <button type="button"
                        onClick={() => this.props.clickOnTarget(this.props.annotation)}
                        className="btn btn-outline btn-success btn-sm btn-show-more"> <FontAwesomeIcon icon={faBullseye} />
                    </button>
                    
                    {/* Afficher la redirection vers la zone de l'annotation */}
                    {/* {this.state.url && <a href={this.state.url} className="btn btn-outline btn-success btn-sm btn-show-more" target="_blank"> <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>} */}
                </div>
            </div >
        )
    }
}
export default OneCardView