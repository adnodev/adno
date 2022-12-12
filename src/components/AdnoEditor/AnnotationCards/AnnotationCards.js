import { Component } from "react";
import ReactHtmlParser from 'react-html-parser';
import { withRouter } from "react-router";

// Import FontAwesome for all icons
import { faDownLong, faEdit, faTrashAlt, faUpLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import popup alerts
import Swal from "sweetalert2";

// JS Utils 
import { buildTagsList, createDate, insertInLS } from "../../../../Utils/utils";

//Imports CSS
import "./AnnotationCards.css";

class AnnotationCards extends Component {
    constructor(props) {
        super(props);
    }

    // Update project values
    
    
    // updateProjectTitle(newTitle) {
    //     this.props.updateProject({ ...this.props.selectedProject, "title": newTitle })
    //     insertInLS(this.props.selectedProject.id, JSON.stringify({ ...this.props.selectedProject, "title": newTitle, "modified": createDate() }))
    // }

    // updateProjectDesc(newDesc) {
    //     this.props.updateProject({ ...this.props.selectedProject, "description": newDesc })
    //     insertInLS(this.props.selectedProject.id, JSON.stringify({ ...this.props.selectedProject, "description": newDesc, "modified": createDate() }))
    // }

    // updateProjectAutor(newAutor) {
    //     this.props.updateProject({ ...this.props.selectedProject, "autor": newAutor })
    //     insertInLS(this.props.selectedProject.id, JSON.stringify({ ...this.props.selectedProject, "autor": newAutor, "modified": createDate() }))
    // }

    // updateProjectEditor(newEditor) {
    //     this.props.updateProject({ ...this.props.selectedProject, "editor": newEditor })
    //     insertInLS(this.props.selectedProject.id, JSON.stringify({ ...this.props.selectedProject, "editor": newEditor, "modified": createDate() }))
    // }

    // updateProjectRights(rights) {
    //     this.props.updateProject({ ...this.props.selectedProject, "rights": rights })
    //     insertInLS(this.props.selectedProject.id, JSON.stringify({ ...this.props.selectedProject, "rights": rights, "modified": createDate() }))
    // }

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
        const deleteAnnotation = (index) => {

            Swal.fire({
                title: 'Voulez-vous vraiment supprimer cette annotation ?',
                showCancelButton: true,
                confirmButtonText: 'Oui, supprimer mon annotation',
                cancelButtonText: 'Annuler',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    var annos = this.props.annotations;

                    // remove the selected annotation in the array
                    if (index > -1) {
                        annos.splice(index, 1);
                    }

                    // Update the localStorage without the removed item
                    insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

                    Swal.fire("L'annotation a bien été supprimée", '', 'success')
                        .then((result) => {
                            result.isConfirmed ? this.props.updateAnnos(annos) : ""
                        })
                }
            })
        }


        return (
            <>

                <div className="list_annotations">

                    {/* <label className="label">
                        <span className="label-text">Titre</span>
                    </label>
                    <input type="text" placeholder="Votre titre" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.title} onChange={(e) => this.updateProjectTitle(e.target.value)} />


                    <label className="label">
                        <span className="label-text">Description</span>
                    </label>
                    <input type="text" placeholder="Renseignez ici la description" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.description} onChange={(e) => this.updateProjectDesc(e.target.value)} />


                    <label className="label">
                        <span className="label-text">Auteur</span>
                    </label>
                    <input type="text" placeholder="Renseignez ici l'auteur" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.autor} onChange={(e) => this.updateProjectAutor(e.target.value)} />
                    
                    <label className="label">
                        <span className="label-text">Editeur</span>
                    </label>
                    <input type="text" placeholder="Renseignez ici l'editeur" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.editor} onChange={(e) => this.updateProjectEditor(e.target.value)} />


                    <label className="label">
                        <span className="label-text">Attribution des droits</span>
                    </label>
                    <input type="text" placeholder="Renseignez ici les droits de l'oeuvre" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.rights} onChange={(e) => this.updateProjectRights(e.target.value)} />


                    <small id="autosaving-txt" className="form-text text-muted">Les données que vous saisissez sont enregistrées automatiquement</small> */}

                    {/* <h3 className="adno-nb-annos"> {this.props.annotations.length} annotation(s) trouvée(s)</h3> */}


                    {
                        this.props.annotations.map((annotation, index) => {
                            return (
                                <div className="anno-card" key={`anno_${index}`}>
                                    <div className="anno-card-body">
                                        <h5 className="card-title adno-card-title">{annotation.body[0] && annotation.body[0].value ? ReactHtmlParser(annotation.body[0].value) : "Aucun titre"}</h5>

                                        {/* <TTS text={stripHtml(annotation.body[0].value)} /> */}

                                        <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(annotation)} </h6>

                                        <div className="anno-cards">
                                            <button className="btn btn-sm btn-error" onClick={() => deleteAnnotation(index)}> <FontAwesomeIcon icon={faTrashAlt} /></button>
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