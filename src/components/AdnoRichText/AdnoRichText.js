import EditorJS from "@editorjs/editorjs";
import Header from '@editorjs/header';
import LinkTool from '@editorjs/link';
import Quote from '@editorjs/quote';
import { faCheckCircle, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Paragraph from "editorjs-paragraph-with-alignment";
import { Component } from "react";
import { TagsInput } from 'react-tag-input-component';
import { insertInLS } from '../../../Utils/utils';
import "./AdnoRichText.css";
import RichEditorImage from "./RichEditorImage/RichEditorImage";
import WikiSearch from "./Wikidata/WikiSearch";

class AdnoRichText extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDeleting: false,
      selectedTags: this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.length > 0 && this.props.selectedAnnotation.body.filter(anno => anno.purpose === "tagging").reduce((a, b) => [...a, b.value], []) || []
    }
  }

  editor = new EditorJS({
    autofocus: true,
    holder: "editorJS",
    data: {
      "blocks": this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.filter(anno => anno.type === "AdnoRichText")[0] ? this.props.selectedAnnotation.body.filter(anno => anno.type === "AdnoRichText")[0].value : []
    },
    tools: {
      image: RichEditorImage,
      // wikidata: WikiSearch,
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
      },
      linkTool: LinkTool,
      header: {
        class: Header,
        config: {
          placeholder: 'Votre titre',
          levels: [1, 2],
          defaultLevel: 1
        }
      },
      quote: Quote
    }
  });

  deleteAnnotation = () => {
    var annotationID = this.props.selectedAnnotation.id
    var annos = this.props.annotations;

    // Update the localStorage without the removed item
    insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))
    this.props.updateAnnos(annos.filter(annotation => annotation.id != annotationID))
  }

  saveAnnotationText = () => {
    let txt = "";
    this.editor.save().then(outputData => {
      outputData.blocks.forEach(block => {
        switch (block.type) {
          case "header":
            let html_tag = `<h${block.data.level}>`;
            let html_closing_tag = `</h${block.data.level}>`;
            txt += `${html_tag}${block.data.text}${html_closing_tag}`;
            break;
          case "image":
            if (block.data && block.data.url !== "") {
              txt += `<img src="${block.data.url}"</img>`;
            }
            break;
          case "wikidata":
            if (block.data) {
              txt += `<img src="${block.data.imgUrl}"</img>`;
              txt += `<a href="${block.data.wiki_link}" target="_blank">${block.data.title}(${block.data.description})</a>`;
            }
            break;
          default:
            txt += `<p>${block.data.text}</p>`;
        }

      })

      let annos = JSON.parse(localStorage.getItem(`${this.props.selectedProjectId}_annotations`))

      let current_anno = {
        "type": "TextualBody",
        "value": txt,
        "purpose": "commenting"
      }

      let current_anno_with_blocks = {
        "type": "AdnoRichText",
        "value": outputData.blocks,
        "purpose": "richtext"
      }


      let allTags = this.state.selectedTags.map(tag => {
        return (
          {
            "type": "TextualBody",
            "value": tag,
            "purpose": "tagging"
          }
        )
      })

      let newBody = [current_anno, current_anno_with_blocks, ...allTags]

      // annos.filter(anno => anno.id === this.props.selectedAnnotation.id)[0].body = [current_anno, current_anno_with_blocks]
      annos.filter(anno => anno.id === this.props.selectedAnnotation.id)[0].body = newBody

      insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos))
      this.props.updateAnnos(annos)
      this.props.closeRichEditor()

    })

  }

  render() {
    return (
      <div className="card w-96 bg-base-100 shadow-xl rich-card-editor">
        <div className="card-body">
          <div className="card-actions justify-end">
            <button className="btn btn-square btn-sm" onClick={() => this.props.closeRichEditor()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="card-body over-hidden">
            <div class="card-text">
              <div id="editorJS" class="p-3"></div>
            </div>
          </div>

          <TagsInput
            value={this.state.selectedTags}
            onChange={(tags) => this.setState({ selectedTags: tags })}
            placeHolder="Ajouter un tag"
          />

          <div className="rich-card-editor-btns">
            {!this.state.isDeleting && <button className="btn btn-error" onClick={() => this.setState({ isDeleting: true })}> <FontAwesomeIcon icon={faTrash} /> Supprimer </button>}
            {this.state.isDeleting && <button className="btn btn-success" onClick={() => { this.setState({ isDeleting: false }), this.deleteAnnotation(), this.props.closeRichEditor() }}> <FontAwesomeIcon icon={faCheckCircle} /> Confirmer </button>}
            <button className="btn" onClick={() => this.saveAnnotationText()}><FontAwesomeIcon icon={faSave} /> Enregistrer </button>
          </div>

        </div>
      </div>
    )
  }
}

export default AdnoRichText