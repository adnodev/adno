import { Component } from "react";
import ReactMarkdown from 'react-markdown'

import "./AdnoMarkdown.css";

class AdnoMdViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    getAnnoBody = () => {
        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            return this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0] ? this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0].value : ""
        } else {
            return ""
        }
    }

    render() {
        return (
            <div className="anno-full-view">
                <div className="text-rich">
                    <div className="card w-96 bg-base-100 shadow-xl rich-card-editor">
                        <div className="card-body">
                            <div className="card-actions justify-end">
                                <button className="btn btn-square btn-sm" onClick={() => this.props.closeFullView()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="card-body over-hidden">
                                <div className="markdown-body">
                                    <ReactMarkdown children={this.getAnnoBody()} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default AdnoMdViewer;