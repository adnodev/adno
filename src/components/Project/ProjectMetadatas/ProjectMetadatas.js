import { Component } from "react";

// Add Translations
import { withTranslation } from "react-i18next";

// Import CSS
import "./ProjectMetadatas.css"

class ProjectMetadatas extends Component {
    render() {
        return (
            <div className="project-metadatas-backdrop">
                <div className="project-metadatas-container">
                    <div className="card-actions justify-end closeBtnMetadatas">
                        <button className="btn btn-square btn-sm" onClick={() => this.props.closeProjectMetadatas()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="project-metadatas">
                        {
                            this.props.selectedProject.title &&
                            <>
			        <label className="form-control w-full">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.title')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.title} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.description &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.description')}</span>
                                    </div>
				    <textarea placeholder={this.props.t('project.metadatas_plh.description')} className="textarea textarea-bordered h-24 textarea-lg w-full max-w-4xl" value={this.props.selectedProject.description} disabled></textarea>
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.creator &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.author')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.creator} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.editor &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.editor')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.editor} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.rights && 
		            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.rights')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.rights} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.manifest_url &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.source')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.manifest_url} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.img_url &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.source')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.img_url} disabled />
                                </label>
                            </>
                        }

                        {this.props.selectedProject.creation_date &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.creation_date')}</span>
                                    </div>
                                <input type="text" className="input input-bordered w-full max-w-4xl" value={new Date(this.props.selectedProject.creation_date).toLocaleString()} disabled />
                                </label>
                            </>

                        }

                        {
                            this.props.selectedProject.last_update && 
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.last_update')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={new Date(this.props.selectedProject.last_update).toLocaleString()} disabled />
                                </label>
                            </>
                        }

                        {
                            this.props.selectedProject.id &&
                            <>
			        <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('project.metadatas.identifier')}</span>
                                    </div>
                                    <input type="text" className="input input-bordered w-full max-w-4xl" value={this.props.selectedProject.id} disabled />
                                </label>
                            </>
                        }

			<label className="form-control w-full mt-4">
                            <div className="label font-medium">
                                <span className="label-text">{this.props.t('project.metadatas.format')}</span>
                            </div>
                            <input type="text" className="input input-bordered w-full max-w-xs" value="Adno" disabled />
                        </label>

                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(ProjectMetadatas);
