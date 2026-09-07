import { Component } from "react";

// Import Utils
import { buildTagsList } from "../../../../Utils/utils";

// Import Html Parser
import parse from 'html-react-parser';

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons"

// Add translations
import { withTranslation } from "react-i18next";

import { AnnotationBadges } from "../../../AnnotationBadges/AnnotationBadges"

class OneCardView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            fullView: false,
            annoBody: this.props.annotation.body[0] && this.props.annotation.body[0].value && parse(this.props.annotation.body[0].value)
        }
    }

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

    render() {
        return (
            <div className="anno-card-body">
                <AnnotationBadges annotation={this.props.annotation} translate={this.props.t} />

                <div className="card-tags-list">
                    {
                        buildTagsList(this.props.annotation).map((tag, idx) => {
                            return (
                                <div key={`${tag}${idx}`} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                                    {tag.value}
                                </div>
                            )
                        })
                    }
                </div>

                <div className="adno-card-body">
                    {this.getAnnotationHTMLBody()}
                </div>


                <div className="btn-line-one-card">

                    {this.state.annoBody && this.props.contentPosition === 'floating' && <button type="button" className="btn btn-outline btn-sm btn-show-more bg-white"
                        onClick={event => {
                            event.stopPropagation()
                            this.props.openFullAnnotationView(this.props.annotation)
                        }}>
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.read_more')}>
                            <FontAwesomeIcon icon={faExpand} />
                        </div>
                    </button>}
                </div>
            </div >
        )
    }
}
export default withTranslation()(OneCardView);
