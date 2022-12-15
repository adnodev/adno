import { Component } from "react";

// Import Utils
import { buildTagsList } from "../../../../Utils/utils";
import ReactHtmlParser from 'react-html-parser';
import OneCardFullView from "./OneCardFullView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowUpRightFromSquare, faBullseye, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

class OneCardView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fullView: false,
            url: "",
            annoBody: []
        }
    }

    componentDidMount() {
        this.buildExternalLink()
        this.createBody(100)
    }

    createBody = (maxLength) => {
        if (this.props.annotation.body[0] && this.props.annotation.body[0].value) {
            let txt = ReactHtmlParser(this.props.annotation.body[0].value)

            let filteredTXT = txt && txt.filter(item => item.type !== "img")


            let totalLength = 0
            let txtToReturn = []

            filteredTXT.forEach(text => {
                if (totalLength < maxLength && text.props.children[0].length < maxLength) {
                    txtToReturn.push(text)
                } else if (totalLength < maxLength && text.props.children[0].length > maxLength) {
                    text.props.children[0] = text.props.children[0].substring(0, maxLength - totalLength) + "..."
                    txtToReturn.push(text)
                }

                totalLength += text.props.children[0].length
            })


            this.setState({ annoBody: txtToReturn })

        } else {
            return "Cette annotation ne contient aucun texte"
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
                }).catch(() => {
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
                <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(this.props.annotation)} </h6>

                <h5 className="card-title adno-card-title">{this.state.annoBody}</h5>


                <div className="btn-line-one-card">

                    {
                        this.props.annotation.body.filter(anno => anno.type === "AdnoRichText")[0] &&
                        this.props.annotation.body.filter(anno => anno.type === "AdnoRichText")[0].value.length > 2 &&
                        <button type="button" className="btn btn-outline btn-info btn-sm btn-show-more" onClick={() => this.setState({ fullView: true })}> Voir <FontAwesomeIcon icon={faPlusCircle} /></button>
                    }

                    <button type="button" onClick={() => this.props.clickOnTarget()} className="btn btn-outline btn-success btn-sm btn-show-more"> <FontAwesomeIcon icon={faBullseye} /></button>
                    {this.state.url && <a href={this.state.url} className="btn btn-outline btn-success btn-sm btn-show-more" target="_blank"> <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>}
                </div>

                {
                    this.state.fullView &&
                    <OneCardFullView fullAnnotation={this.props.annotation} closeFullView={() => this.setState({ fullView: false })} />
                }
            </div >
        )
    }
}
export default OneCardView