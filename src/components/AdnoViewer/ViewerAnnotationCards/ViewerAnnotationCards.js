import { Component } from 'react';
import { withRouter } from "react-router";

// Import CSS
import "./ViewerAnnotationCards.css";
import OneCardView from './OneCardView/OneCardView';

class ViewerAnnotationCards extends Component {
    constructor(props) {
        super(props)
        this.state = {
            currentAnno: -1
        }
    }

    selectAnno = (position) => {
        document.getElementsByTagName("iiif-storyboard")[0].__vue_custom_element__.$children[0].sendMessage({ 'function': 'next', 'args': position });

        this.setState({ currentAnno: position })
    }

    unselectAnno = () => {
        document.getElementsByTagName("iiif-storyboard")[0].__vue_custom_element__.$children[0].sendMessage({ 'function': 'next', 'args': -1 });

        this.setState({ currentAnno: -1 })
    }

    clickOnTarget(index){
        this.state.currentAnno === index ? this.unselectAnno() : this.selectAnno(index)
    }


    render() {
        return (
            <div className="adno-viewer-list-annos">
                {this.props.annotations.map((annotation, index) => {
                    return (
                        <div key={`viewer_anno_${index}`} className={this.state.currentAnno === index ? "adno-viewer-card selectedAnno" : "adno-viewer-card"}>
                            <OneCardView annotation={annotation} clickOnTarget={() => this.clickOnTarget(index)} />
                        </div>
                    )
                })}
            </div >
        )
    }
}
export default withRouter(ViewerAnnotationCards)