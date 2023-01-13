import { Component } from 'react';
import { withRouter } from "react-router";

// Import CSS
import "./ViewerAnnotationCards.css";
import OneCardView from './OneCardView/OneCardView';

class ViewerAnnotationCards extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="adno-viewer-list-annos">
                {this.props.annotations.map((annotation, index) => {
                    return (
                        <div id={`anno_card_${annotation.id}`} key={`viewer_anno_${index}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"}>
                            <OneCardView  openFullAnnotationView={(annotation) => this.props.openFullAnnotationView(annotation)} project={this.props.selectedProject} annotation={annotation} clickOnTarget={() => this.props.changeSelectedAnno(annotation)} />
                        </div>
                    )
                })}
            </div >
        )
    }
}
export default withRouter(ViewerAnnotationCards)