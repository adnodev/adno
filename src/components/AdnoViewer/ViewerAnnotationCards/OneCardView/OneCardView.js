import { Component } from "react";

import { buildTagsList } from "../../../../Utils/utils";
import { annotationHtml } from "../../../../services/format";

import parse from 'html-react-parser';

import { withTranslation } from "react-i18next";

import { AnnotationBadges } from "../../../AnnotationBadges/AnnotationBadges"

class OneCardView extends Component {
    getAnnotationHTMLBody = () => {
        const html = annotationHtml(this.props.annotation)

        if (!html) {
            return <span className="no-content">Ø {this.props.t('annotation.no_content')}</span>
        }

        return parse(html)
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

                {this.props.children}
            </div>
        )
    }
}
export default withTranslation()(OneCardView);
