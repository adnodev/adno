import { Component } from 'react';
import { withRouter } from "react-router";

// Import CSS
import "./ViewerAnnotationCards.css";

// Import Components
import OneCardView from './OneCardView/OneCardView';
import { buildTagsList } from '../../../Utils/utils';
import { withTranslation } from 'react-i18next';

class ViewerAnnotationCards extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        const annotationWithTags = this.props.annotations
            .map(annotation => ({
                ...annotation,
                tags: buildTagsList(annotation).map(tag => tag.value)
            }))

        return (
            <div className="annotations_list">
                {
                    annotationWithTags
                        .map((annotation, index) => {
                            return (
                                <div id={`anno_card_${annotation.id}`} key={`viewer_anno_${index}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"}>
                                    <OneCardView openFullAnnotationView={(annotation) => this.props.openFullAnnotationView(annotation)} project={this.props.selectedProject} annotation={annotation} clickOnTarget={() => this.props.changeSelectedAnno(annotation)} selectedAnno={this.props.selectedAnno} />
                                </div>
                            )
                        })}
            </div>
        )
    }
}
export default withTranslation()(withRouter(ViewerAnnotationCards))