import { Component } from "react";

import EditorJS from "@editorjs/editorjs";
import Header from '@editorjs/header';
import Quote from '@editorjs/quote';
import Paragraph from "editorjs-paragraph-with-alignment";
import RichEditorImage from "../../../AdnoRichText/RichEditorImage/RichEditorImage";
import CodeTool from "@editorjs/code";

class OneCardFullView extends Component {
    constructor(props) {
        super(props);
    }

    editor = new EditorJS({
        autofocus: true,
        readOnly: true,
        holder: "editorJS",
        data: {
            "blocks": this.props.fullAnnotation.body && this.props.fullAnnotation.body.filter(anno => anno.type === "AdnoRichText")[0] ? this.props.fullAnnotation.body.filter(anno => anno.type === "AdnoRichText")[0].value : []
        },
        tools: {
            image: RichEditorImage,
            // wikidata: WikiSearch,
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
            },
            header: {
                class: Header,
                config: {
                    placeholder: 'Votre titre',
                    levels: [1, 2],
                    defaultLevel: 1
                }
            },
            quote: Quote,
            code: CodeTool
        }
    });

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
                                <div className="card-text">
                                    <div id="editorJS"></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
export default OneCardFullView