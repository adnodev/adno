import { Component } from "react";
import "./ProjectMetadatas.css"

class ProjectMetadatas extends Component {
    render() {
        return (
            <div className="project-metadatas-backdrop">
                <div className="project-metadatas-container">
                    <div className="card-actions justify-end">
                        <button className="btn btn-square btn-sm" onClick={() => this.props.closeProjectMetadatas()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="project-metadatas">
                        {
                            this.props.selectedProject.id &&
                            <>
                                <label className="label">
                                    <span className="label-text">Identifier</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.id} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.manifest_url &&
                            <>
                                <label className="label">
                                    <span className="label-text">Source</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.manifest_url} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.img_url &&
                            <>
                                <label className="label">
                                    <span className="label-text">img_url</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.img_url} disabled />
                            </>
                        }
                        {this.props.selectedProject.creation_date &&
                            <>
                                <label className="label">
                                    <span className="label-text">Date de création</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.creation_date} disabled />
                            </>

                        }
                        {
                            this.props.selectedProject.last_update && <>
                                <label className="label">
                                    <span className="label-text">Dernière modification</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.last_update} disabled />
                            </>
                        }

                        <label className="label">
                            <span className="label-text">Format</span>
                        </label>
                        <input type="text" className="input input-bordered w-full max-w-xs" value="Adno" disabled />

                        {
                            this.props.selectedProject.rights && <>
                                <label className="label">
                                    <span className="label-text">Droits attribués</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.rights} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.title &&
                            <>
                                <label className="label">
                                    <span className="label-text">Titre</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.title} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.description &&
                            <>
                                <label className="label">
                                    <span className="label-text">Description</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.description} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.autor &&
                            <>
                                <label className="label">
                                    <span className="label-text">Auteur</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.autor} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.editor &&
                            <>
                                <label className="label">
                                    <span className="label-text">Editeur</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.editor} disabled />
                            </>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default ProjectMetadatas