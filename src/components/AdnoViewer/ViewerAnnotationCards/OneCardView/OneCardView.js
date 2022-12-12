import { Component } from "react";

// Import Utils
import { buildTagsList } from "../../../../../Utils/utils";
import ReactHtmlParser from 'react-html-parser';
import OneCardFullView from "./OneCardFullView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

class OneCardView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fullView: false
        }
    }

    annotationBody = () => {
        if (this.props.annotation.body[0] && this.props.annotation.body[0].value) {
            let txt = ReactHtmlParser(this.props.annotation.body[0].value)

            let filteredTXT = txt && txt.filter(item => item.type !== "img")

            if (filteredTXT && filteredTXT.length > 1) {
                return [filteredTXT[0], filteredTXT[1]]
            } else {
                return filteredTXT
            }

        } else {
            return "Cette annotation ne contient aucun texte"
        }

    }
    render() {
        return (
            <div className="anno-card-body">
                <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(this.props.annotation)} </h6>

                <h5 className="card-title adno-card-title">{this.annotationBody()}</h5>


                <div className="btn-line-one-card">

                    {
                        this.props.annotation.body.filter(anno => anno.type === "AdnoRichText")[0] &&
                        this.props.annotation.body.filter(anno => anno.type === "AdnoRichText")[0].value.length > 2 &&
                        <button type="button" className="btn btn-outline btn-info btn-sm btn-show-more" onClick={() => this.setState({ fullView: true })}> Voir <FontAwesomeIcon icon={faPlusCircle} /></button>
                    }

                    <button type="button" onClick={() => this.props.clickOnTarget()} className="btn btn-outline btn-success btn-sm btn-show-more"> <FontAwesomeIcon icon={faBullseye} /></button>
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