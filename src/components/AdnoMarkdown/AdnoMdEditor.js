import { Component } from 'react';

// Import FontAwesome
import { faCheckCircle, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import tags input
import { TagsInput } from 'react-tag-input-component';

// Import Markdown editor
import { Editor } from '@toast-ui/react-editor';

// import removeMarkdown from "markdown-to-text";
import { insertInLS } from '../../Utils/utils';

// Import CSS
import '@toast-ui/editor/dist/toastui-editor.css';

class AdnoMdEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDeleting: false,
            // selectedTags: this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.length > 0 && this.props.selectedAnnotation.body.filter(anno => anno.purpose === "tagging").reduce((a, b) => [...a, b.value], []) || [],
            // markdown: this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.filter(anno => anno.type === "AdnoMarkdown")[0] && this.props.selectedAnnotation.body.filter(anno => anno.type === "AdnoMarkdown")[0].value || ""
            markdown: [],
            selectedTags: []

        }

        console.log("props : ", props.selectedAnnotation.body.filter(anno => anno.type === "TextualBody")[0].value);
    }

    editorRef = React.createRef();

    saveMD = () => {
        console.log(this.editorRef.current.getInstance().getMarkdown());
    }


    // saveMarkdownAnnotation() {
    //     let annos = [...this.props.annotations]

    //     let rawText = removeMarkdown(this.state.markdown, {
    //         stripListLeaders: true, // strip list leaders (default: true)
    //         listUnicodeChar: '',     // char to insert instead of stripped list leaders (default: '')
    //         gfm: true,            // support GitHub-Flavored Markdown (default: true)
    //         useImgAltText: true      // replace images with alt-text, if present (default: true)
    //     })

    //     let current_anno = {
    //         "type": "TextualBody",
    //         "value": rawText,
    //         "purpose": "commenting"
    //     }

    //     let annotationMD = {
    //         "type": "AdnoMarkdown",
    //         "value": this.state.markdown,
    //         "purpose": "commenting"
    //     }

    //     let allTags = this.state.selectedTags.map(tag => {
    //         return (
    //             {
    //                 "type": "TextualBody",
    //                 "value": tag,
    //                 "purpose": "tagging"
    //             }
    //         )
    //     })

    //     let newBody = [current_anno, annotationMD, ...allTags]

    //     if (annos.filter(anno => anno.id === this.props.selectedAnnotation.id).length > 0) {
    //         annos.filter(anno => anno.id === this.props.selectedAnnotation.id)[0].body = newBody
    //     } else {
    //         this.props.selectedAnnotation.body = newBody
    //         annos.push(this.props.selectedAnnotation)
    //     }

    //     insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos))
    //     this.props.updateAnnos(annos)
    //     document.getElementById(`anno_edit_card_${this.props.selectedAnnotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    //     this.props.closeMdEditor()
    // }



    render() {
        return (


            <div className="card w-96 bg-base-100 shadow-xl rich-card-editor">
                <div className="card-body">
                    <div className="card-actions justify-end">
                        <button className="btn btn-square btn-sm" onClick={() => this.props.closeMdEditor()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>


                    <Editor
                        initialValue={this.props.selectedAnnotation.body.filter(anno => anno.type === "TextualBody")[0].value}
                        previewStyle="vertical"
                        height="600px"
                        initialEditType="markdown"
                        ref={this.editorRef}
                    />

                    <div className="editor-tags">
                        <TagsInput
                            value={this.state.selectedTags}
                            onChange={(tags) => this.setState({ selectedTags: tags })}
                            placeHolder="Ajouter un tag"
                        />
                    </div>


                    <div className="rich-card-editor-btns">
                        {!this.state.isDeleting && <button className="btn btn-error" onClick={() => this.setState({ isDeleting: true })}> <FontAwesomeIcon icon={faTrash} /> Supprimer </button>}
                        {this.state.isDeleting && <button className="btn btn-success" onClick={() => { this.setState({ isDeleting: false }), this.deleteAnnotation(), this.props.closeRichEditor() }}> <FontAwesomeIcon icon={faCheckCircle} /> Confirmer </button>}
                        <button className="btn" onClick={() => this.saveMD()}><FontAwesomeIcon icon={faSave} /> Enregistrer </button>
                    </div>

                </div>
            </div>

        )
    }
}
export default AdnoMdEditor