import { faCancel, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import Swal from "sweetalert2";
import { createDate, insertInLS } from "../../../../Utils/utils";
import "./ProjectEditMetadatas.css"

class ProjectEditMetadatas extends Component {
    constructor(props){
        super(props);
        this.state = {
            project: this.props.selectedProject,
            isDeleting: false
        }
    }

    updateProjectMetadatas = () => {
        this.props.updateProject(this.state.project)
        insertInLS(this.state.project.id, JSON.stringify(this.state.project))
        this.props.closeProjectMetadatas()

        Swal.fire({
            title: "Projet édité avec succés !",
            showCancelButton: false,
            confirmButtonText: 'Ok',
            icon: 'success',
        })
    }

    render() {
        return (
            <div className="project-metadatas-backdrop">
                <form className="project-metadatas-container" onSubmit={(e) => {e.preventDefault(), this.updateProjectMetadatas(e)}}>


                    <div className="card-actions justify-end">
                        <button className="btn btn-square btn-sm" onClick={() => this.props.closeProjectMetadatas()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>


                    <div className="project-metadatas">

                        <label className="label">
                            <span className="label-text">Titre</span>
                        </label>
                        <input type="text" placeholder="Votre titre" className="input input-bordered w-full max-w-xs" value={this.state.project.title} onChange={(e) => this.setState({project: {...this.state.project, title: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <input type="text" placeholder="Renseignez ici la description" className="input input-bordered w-full max-w-xs" value={this.state.project.description} onChange={(e) => this.setState({project: {...this.state.project, description: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">Auteur</span>
                        </label>
                        <input type="text" placeholder="Renseignez ici l'auteur" className="input input-bordered w-full max-w-xs" value={this.state.project.autor} onChange={(e) => this.setState({project: {...this.state.project, autor: e.target.value}})}/>

                        <label className="label">
                            <span className="label-text">Editeur</span>
                        </label>
                        <input type="text" placeholder="Renseignez ici l'editeur" className="input input-bordered w-full max-w-xs" value={this.state.project.editor} onChange={(e) => this.setState({project: {...this.state.project, editor: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">Attribution des droits</span>
                        </label>
                        <input type="text" placeholder="Renseignez ici les droits de l'oeuvre" className="input input-bordered w-full max-w-xs" value={this.state.project.rights} onChange={(e) => this.setState({project: {...this.state.project, rights: e.target.value}})} />


                        <div className="metadata-editor-btns">
                             <button type="submit" className="btn" ><FontAwesomeIcon icon={faSave} />  Enregistrer </button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}
export default ProjectEditMetadatas;