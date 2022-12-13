import { Component } from "react";
import ReactHtmlParser from 'react-html-parser';
import { withRouter } from "react-router";

// Import FontAwesome for all icons
import { faDownLong, faEdit, faTrashAlt, faUpLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import popup alerts
import Swal from "sweetalert2";

// JS Utils 
import { buildTagsList, insertInLS } from "../../../Utils/utils";

//Imports CSS
import "./AnnotationCards.css";

class AnnotationCards extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        // Function to move an annotation up one place
        const annoSwitchUp = (index) => {

            var annos = this.props.annotations;

            var annoToSwitch = annos[index - 1]

            annos[index - 1] = annos[index]
            annos[index] = annoToSwitch

            insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

            this.props.updateAnnos(annos)
        }

        // Function to move an annotation down one place
        const annoSwitchDown = (index) => {
            var annos = this.props.annotations;

            var annoToSwitch = annos[index + 1]

            annos[index + 1] = annos[index]
            annos[index] = annoToSwitch

            insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

            this.props.updateAnnos(annos)
        }

        // Function to delete an annotation
        const deleteAnnotation = (annotationID) => {

            Swal.fire({
                title: 'Voulez-vous vraiment supprimer cette annotation ?',
                showCancelButton: true,
                confirmButtonText: 'Oui, supprimer mon annotation',
                cancelButtonText: 'Annuler',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    var annos = this.props.annotations;

                    // Update the localStorage without the removed item
                    insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))

                    Swal.fire("L'annotation a bien été supprimée", '', 'success')
                        .then((result) => {
                            result.isConfirmed && this.props.updateAnnos(annos.filter(annotation => annotation.id != annotationID))
                        })
                }
            })
        }


        return (
            <>

                <div className="list_annotations">
                    {
                        this.props.annotations.map((annotation, index) => {
                            return (
                                <div className="anno-card" key={`anno_${annotation.id}`}>
                                    <div className="anno-card-body">
                                        <h5 className="card-title adno-card-title">{annotation.body[0] && annotation.body[0].value ? ReactHtmlParser(annotation.body[0].value) : "Aucun titre"}</h5>

                                        {/* <TTS text={stripHtml(annotation.body[0].value)} /> */}

                                        <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(annotation)} </h6>

                                        <div className="anno-cards">
                                            <button className="btn btn-sm btn-error" onClick={() => deleteAnnotation(annotation.id)}> <FontAwesomeIcon icon={faTrashAlt} /></button>
                                            <button className="btn btn-sm btn-success" onClick={() => this.props.openRichEditor(annotation)}> <FontAwesomeIcon icon={faEdit} /></button>
                                            {index < this.props.annotations.length - 1 ? <button className="btn btn-sm btn-primary" onClick={() => annoSwitchDown(index)}> <FontAwesomeIcon icon={faDownLong} /> </button> : <></>}
                                            {index > 0 ? <button className="btn btn-sm btn-primary" onClick={() => annoSwitchUp(index)}> <FontAwesomeIcon icon={faUpLong} /> </button> : <></>}
                                        </div>
                                    </div >
                                </div >
                            )
                        })
                    }
                </div >
            </>

        )
    }
}
export default withRouter(AnnotationCards)