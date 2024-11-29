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
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.title')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.title} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.description &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.description')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.description} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.creator &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.author')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.creator} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.editor &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.editor')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.editor} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.rights && <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.rights')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.rights} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.manifest_url &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.source')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.manifest_url} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.img_url &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.source')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.img_url} disabled />
                            </>
                        }

                        {this.props.selectedProject.creation_date &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.creation_date')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.creation_date} disabled />
                            </>

                        }

                        {
                            this.props.selectedProject.last_update && <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.last_update')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.last_update} disabled />
                            </>
                        }

                        {
                            this.props.selectedProject.id &&
                            <>
                                <label className="label">
                                    <span className="label-text">{this.props.t('project.metadatas.identifier')}</span>
                                </label>
                                <input type="text" className="input input-bordered w-full max-w-xs" value={this.props.selectedProject.id} disabled />
                            </>
                        }

                        <label className="label">
                            <span className="label-text">{this.props.t('project.metadatas.format')}</span>
                        </label>
                        <input type="text" className="input input-bordered w-full max-w-xs" value="Adno" disabled />

                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(ProjectMetadatas);
