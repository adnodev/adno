import { faDownload, faFile, faFilePen, faGear, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { createExportProjectJsonFile } from "../../../Utils/utils";

class Navbar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="navbar text-neutral-content">
                <Link to={"/"} className="project-navbar-link project-page-title" title={this.props.t('navbar.back_home')}>
                    <h1>ADNO</h1>
                </Link>
                <Link to={"/"} className="project-navbar-link" title={this.props.t('navbar.back_home')}> <FontAwesomeIcon icon={faHome} size="lg" /> </Link>

                {/* // Display a modal to download and share the current project */}
                <label htmlFor="my-modal" style={{ "background": "none", "border": "none" }} className="btn project-navbar-link"><FontAwesomeIcon icon={faDownload} size="lg" /> </label>

                <input type="checkbox" id="my-modal" className="modal-toggle" />
                <div className="modal">
                    <div className="modal-box" style={{ "color": "initial" }}>
                        <h3 className="font-bold text-lg">{this.props.t('navbar.share_project')}</h3>
                        <p className="py-4">{this.props.t('navbar.share_project_desc1')}</p>
                        <p className="py-4">{this.props.t('navbar.share_project_desc2')}</p>
                        <p className="py-4">{this.props.t('navbar.share_project_desc3')} <a className="adno-link" href="https://adno.app/" target="_blank">{this.props.t('navbar.share_project_desc4')}</a></p>
                        <div className="modal-action">
                            <label htmlFor="my-modal" className="btn">{this.props.t('buttons.cancel')}</label>
                            <label className="btn btn-success">
                                {
                                    this.props.selectedProject && this.props.selectedProject.id &&
                                    <a id={"download_btn_" + this.props.selectedProject.id} href={createExportProjectJsonFile(this.props.selectedProject.id)} download={this.props.selectedProject.title + ".json"} title={this.props.t('navbar.download_project')}> <FontAwesomeIcon icon={faDownload} size="lg" /> </a>
                                }
                            </label>
                        </div>
                    </div>
                </div>

                <button onClick={() => this.props.showProjectMetadatas()} className="project-navbar-link" title={this.props.editMode ? this.props.t('navbar.edit_project') : this.props.t('navbar.show_metadatas')}><FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} size="lg" /></button>

                <strong>{this.props.selectedProject.title} {this.props.selectedProject.autor && `(${this.props.selectedProject.autor})`}</strong>

                {
                    process.env.ADNO_MODE === "FULL" &&
                    <div className="dl_toggle">

                        {
                            !this.props.editMode &&
                            <button onClick={() => this.props.showEditorSettings()} className="btn btn-md"><FontAwesomeIcon icon={faGear} size="lg" /></button>
                        }


                        <label className="cursor-pointer label label-toggle">
                            <label>{this.props.t('navbar.edit_mode')}</label>
                            <input type="checkbox" className="toggle toggle-lg toggle-success" value={this.props.editMode}
                                onChange={() => {

                                    // Turn off autoplay
                                    if(this.props.autoplayID !== -1){
                                        clearInterval(this.props.autoplayID)
                                    }

                                    if (this.props.editMode) {
                                        // Unselect current annotation when switching page
                                        this.props.changeSelectedAnno(undefined)
                                        this.props.history.push(`/project/${this.props.match.params.id}/view`)
                                    } else {
                                        // Unselect current annotation when switching page
                                        this.props.changeSelectedAnno(undefined)
                                        this.props.history.push(`/project/${this.props.match.params.id}/edit`)
                                    }
                                }
                                }
                                checked={this.props.editMode} />
                        </label>


                    </div>
                }

            </div>
        )
    }
}

export default withTranslation()(withRouter(Navbar));
