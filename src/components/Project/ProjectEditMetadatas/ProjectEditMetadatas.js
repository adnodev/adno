import { Component } from "react";

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

// Add Translations
import { withTranslation } from "react-i18next";

// Import SweetAlert
import Swal from "sweetalert2";

// Import Utils
import {insertInLS} from "../../../Utils/utils";

// Import CSS
import "./ProjectEditMetadatas.css"

class ProjectEditMetadatas extends Component {
    constructor(props){
        super(props);
        this.state = {
            project: this.props.selectedProject,
            isDeleting: false
        }
    }

    updateProjectMetadatas = (e) => {
        e.preventDefault()

        this.props.updateProject(this.state.project)
        insertInLS(this.state.project.id, JSON.stringify(this.state.project))
        this.props.closeProjectMetadatas()

        Swal.fire({
            title: this.props.t('modal.project_edit_success'),
            showCancelButton: false,
            confirmButtonText: 'Ok',
            icon: 'success',
        })
    }

    render() {
        return (
            <div className="project-metadatas-backdrop">
                <form className="project-metadatas-container" onSubmit={(e) => {this.updateProjectMetadatas(e)}}>


                    <div className="card-actions justify-end closeBtnMetadatas">
                        <button type="button" className="btn btn-square btn-sm" onClick={() => this.props.closeProjectMetadatas()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>


                    <div className="project-metadatas">

                        <label className="label">
                            <span className="label-text">{this.props.t('project.title')}</span>
                        </label>
                        <input type="text" placeholder={this.props.t('project.metadatas_plh.title')}className="input input-bordered w-full max-w-xs" value={this.state.project.title} onChange={(e) => this.setState({project: {...this.state.project, title: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">{this.props.t('project.description')}</span>
                        </label>
                        <input type="text" placeholder={this.props.t('project.metadatas_plh.description')} className="input input-bordered w-full max-w-xs" value={this.state.project.description} onChange={(e) => this.setState({project: {...this.state.project, description: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">{this.props.t('project.author')}</span>
                        </label>
                        <input type="text" placeholder={this.props.t('project.metadatas_plh.author')} className="input input-bordered w-full max-w-xs" value={this.state.project.creator} onChange={(e) => this.setState({project: {...this.state.project, creator: e.target.value}})}/>

                        <label className="label">
                            <span className="label-text">{this.props.t('project.editor')}</span>
                        </label>
                        <input type="text" placeholder={this.props.t('project.metadatas_plh.editor')} className="input input-bordered w-full max-w-xs" value={this.state.project.editor} onChange={(e) => this.setState({project: {...this.state.project, editor: e.target.value}})} />


                        <label className="label">
                            <span className="label-text">{this.props.t('project.metadatas.allocation_rights')}</span>
                        </label>
                        <input type="text" placeholder={this.props.t('project.metadatas_plh.allocation_rights')} className="input input-bordered w-full max-w-xs" value={this.state.project.rights} onChange={(e) => this.setState({project: {...this.state.project, rights: e.target.value}})} />


                        <div className="metadata-editor-btns">
                             <button type="submit" className="btn" ><FontAwesomeIcon icon={faSave} className="mr-2" />  Enregistrer </button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}
export default withTranslation()(ProjectEditMetadatas);
