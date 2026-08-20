import { Component } from 'react';
import { withRouter } from "react-router";

// Import CSS
import "./ViewerAnnotationCards.css";

// Import Components
import OneCardView from './OneCardView/OneCardView';
import { buildTagsList, stripHtml } from '../../../Utils/utils';
import { withTranslation } from 'react-i18next';

const RAIL_SUMMARY_LENGTH = 90

class ViewerAnnotationCards extends Component {
    constructor(props) {
        super(props)
    }

    summarise = (annotation) => {
        const body = Array.isArray(annotation.body) ? annotation.body : []
        const text = body.find(item => item.type === "TextualBody" && item.purpose === "commenting")
        const value = text ? stripHtml(text.value).trim() : ""

        return value.length > RAIL_SUMMARY_LENGTH ? `${value.slice(0, RAIL_SUMMARY_LENGTH)}…` : value
    }

    render() {
        const annotationWithTags = this.props.annotations
            .map(annotation => ({
                ...annotation,
                tags: buildTagsList(annotation).map(tag => tag.value)
            }))

        return (
            <>
                <div className="annotations_rail">
                    {
                        annotationWithTags.map((annotation, index) =>
                            <button type="button"
                                key={`rail_${index}`}
                                className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "rail-dot rail-dot--current" : "rail-dot"}
                                title={this.summarise(annotation)}
                                onClick={() => this.props.changeSelectedAnno(annotation)}>
                                {index + 1}
                            </button>
                        )
                    }
                </div>

                <div className="annotations_list" id="annotations_list">
                    {
                        annotationWithTags
                            .map((annotation, index) => {
                                return (
                                    <div id={`anno_card_${annotation.id}`}
                                        key={`viewer_anno_${index}`}
                                        className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"}
                                        onClick={() => this.props.changeSelectedAnno(annotation)}>
                                        <OneCardView
                                            openFullAnnotationView={(annotation) => this.props.openFullAnnotationView(annotation)}
                                            project={this.props.selectedProject}
                                            annotation={annotation}
                                            contentPosition={this.props.contentPosition}
                                            selectedAnno={this.props.selectedAnno} />
                                    </div>
                                )
                            })}
                </div>
            </>
        )
    }
}
export default withTranslation()(withRouter(ViewerAnnotationCards))