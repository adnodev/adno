import { Component } from "react";
import { withRouter } from "react-router";

// Import Html Parser
import parse from 'html-react-parser';

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faDownLong, faEdit, faTrashAlt, faUpLong, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";

// Import SweetAlert
import Swal from "sweetalert2";

// Import Utils 
import { buildTagsList, generateUUID, insertInLS } from "../../../Utils/utils";

//Imports CSS
import "./AnnotationCards.css";

// Add translations
import { withTranslation } from "react-i18next";

class AnnotationCards extends Component {
    constructor(props) {
        super(props);
    }

    getAnnotationHTMLBody = (annotation) => {
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

    hasAudio = annotation => {
        if (Array.isArray(annotation.body) && annotation.body.length > 0) {
            const resource = annotation.body
                .find(body => body.type === "SpecificResource")
            return resource?.source?.id
        }
        return false
    }

    // Function to move an annotation up one place
    annoSwitchUp = (index) => {

        var annos = this.props.annotations;

        var annoToSwitch = annos[index - 1]

        annos[index - 1] = annos[index]
        annos[index] = annoToSwitch

        insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

        this.props.updateAnnos(annos)
    }

    // Function to move an annotation down one place
    annoSwitchDown = (index) => {
        var annos = this.props.annotations;

        var annoToSwitch = annos[index + 1]

        annos[index + 1] = annos[index]
        annos[index] = annoToSwitch

        insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

        this.props.updateAnnos(annos)
    }

    // Function to delete an annotation
    deleteAnnotation = (annotationID) => {

        Swal.fire({
            title: this.props.t('modal.ask_delete'),
            showCancelButton: true,
            confirmButtonText: this.props.t('modal.confirm_del_annotation'),
            cancelButtonText: this.props.t('modal.cancel'),
            icon: 'warning',
        }).then((result) => {
            if (result.isConfirmed) {
                var annos = this.props.annotations;

                // Update the localStorage without the removed item
                insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))

                Swal.fire(this.props.t('modal.del_annotation_confirmation'), '', 'success')
                    .then((result) => {
                        if (result.isConfirmed) {
                            this.props.updateAnnos(annos.filter(annotation => annotation.id != annotationID))
                        }
                    })
            }
        })
    }


    render() {
        const annotationWithTags = this.props.annotations.map(annotation => {
            return {
                ...annotation,
                tags: buildTagsList(annotation).map(tag => tag.value)
            }
        })

        return (
            <div className="annotations_list">
                {
                    annotationWithTags
                        .map((annotation, index) => {
                            return (
                                <div id={`anno_edit_card_${annotation.id}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"} key={`anno_edit_card_${annotation.id}`}>

                                    {this.hasAudio(annotation) && <FontAwesomeIcon icon={faVolumeHigh} />}
                                    <div className="anno-card-body">

                                        <div className="card-tags-list">
                                            {
                                                annotation.tags.map(tag => {
                                                    return (
                                                        <div key={generateUUID()} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                                                            {tag}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>

                                        <div className="adno-card-body">
                                            {this.getAnnotationHTMLBody(annotation)}
                                        </div>

                                        <div className="btn-line-one-card">
                                            <button className="btn btn-sm" onClick={() => this.props.openRichEditor(annotation)}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.edit')}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </div>
                                            </button>
                                            <button type="button"
                                                onClick={() => this.props.changeSelectedAnno(annotation)}
                                                className="btn btn-sm btn-show-more">
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.target')}>
                                                    <FontAwesomeIcon icon={faBullseye} />
                                                </div>
                                            </button>
                                            {index < this.props.annotations.length - 1 ? <button className="btn btn-sm btn-outline bg-white" onClick={() => this.annoSwitchDown(index)}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.switch_down')}>
                                                    <FontAwesomeIcon icon={faDownLong} />
                                                </div>
                                            </button> : <></>}
                                            {index > 0 ? <button className="btn btn-sm" onClick={() => this.annoSwitchUp(index)}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.switch_up')}>
                                                    <FontAwesomeIcon icon={faUpLong} />
                                                </div>
                                            </button> : <></>}
                                            <button className="btn btn-sm btn-outline btn-error bg-white" onClick={() => this.deleteAnnotation(annotation.id)}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.delete')}>
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                }
            </div >
        )
    }
}
export default withTranslation()(withRouter(AnnotationCards));
