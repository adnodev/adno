import { Component } from "react";
import { withRouter } from "react-router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownLong, faEdit, faPlus, faTrashAlt, faUpLong } from "@fortawesome/free-solid-svg-icons"

import Swal from "sweetalert2";

import OneCardView from "../../AdnoViewer/ViewerAnnotationCards/OneCardView/OneCardView"

import { getTargets } from "../../../Utils/targets"

import "./AnnotationCards.css";

import { withTranslation } from "react-i18next";
import { projectDB } from "../../../services/db";

class AnnotationCards extends Component {
    constructor(props) {
        super(props);
    }

    annoSwitchUp = (index) => {

        const annos = this.props.annotations;

        const annoToSwitch = annos[index - 1]

        annos[index - 1] = annos[index]
        annos[index] = annoToSwitch

        projectDB.updateAnnotations(this.props.match.params.id, annos)
            .then(() => {
                this.props.updateAnnos(annos)
            })
    }

    annoSwitchDown = (index) => {
        const annos = this.props.annotations;

        const annoToSwitch = annos[index + 1]

        annos[index + 1] = annos[index]
        annos[index] = annoToSwitch

        projectDB.updateAnnotations(this.props.match.params.id, annos)
            .then(() => {
                this.props.updateAnnos(annos)
            })
    }

    deleteAnnotation = (annotationID) => {

        Swal.fire({
            title: this.props.t('modal.ask_delete'),
            showCancelButton: true,
            confirmButtonText: this.props.t('modal.confirm_del_annotation'),
            cancelButtonText: this.props.t('modal.cancel'),
            icon: 'warning',
        }).then((result) => {
            if (result.isConfirmed) {
                const annotations = this.props.annotations.filter(annotation => annotation.id != annotationID);

                projectDB.updateAnnotations(this.props.match.params.id, annotations)
                    .then(() => {
                        Swal.fire(this.props.t('modal.del_annotation_confirmation'), '', 'success')
                            .then((result) => {
                                if (result.isConfirmed) {
                                    this.props.updateAnnos(annotations)
                                }
                            })
                    })
            }
        })
    }

    render() {
        return (
            <div className="annotations_list" id="annotations_list">
                {
                    this.props.annotations
                        .map((annotation, index) => {
                            const zones = getTargets(annotation).length

                            return (
                                <div id={`anno_edit_card_${annotation.id}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"} key={`anno_edit_card_${annotation.id}`}
                                    onClick={() => this.props.changeSelectedAnno(annotation)}>

                                    <OneCardView annotation={annotation}>
                                        <div className="btn-line-one-card" onClick={event => event.stopPropagation()}>
                                            <button className="btn btn-sm" onClick={() => this.props.openRichEditor(annotation)}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.edit')}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </div>
                                            </button>
                                            <button type="button"
                                                id={`anno_add_zone_${annotation.id}`}
                                                onClick={() => this.props.startPendingZone(annotation.id)}
                                                className={this.props.pendingZone && this.props.pendingZone.annotationId === annotation.id ? "btn btn-sm btn-active" : "btn btn-sm"}>
                                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('annotation.add_zone')}>
                                                    <FontAwesomeIcon icon={faPlus} />
                                                    {zones > 1 && <span className="zone-count">{zones}</span>}
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
                                    </OneCardView>
                                </div>
                            )
                        })
                }
            </div >
        )
    }
}
export default withTranslation()(withRouter(AnnotationCards));
