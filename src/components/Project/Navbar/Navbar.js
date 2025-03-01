import { faDownload, faFile, faFilePen, faGear, faHome, faReply, faShare, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { Exporter } from "../../Exporter/Exporter";

class Navbar extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <div className="navbar bg-base-300 text-neutral-content">
                <Link to={"/"} className="project-navbar-link" title={this.props.t('navbar.back_home')}
                    style={{
                        color: '#004B6D'
                    }}>
                    <h1>ADNO</h1>
                </Link>


                <strong className="ms-3 text-neutral" style={{
                    maxWidth: 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                }}>{this.props.selectedProject.title}<br /> {(this.props.settings?.tags || []).map(tag => ` #${tag} `)} {this.props.selectedProject.creator && ` [ ${this.props.selectedProject.creator} ]`}
                </strong>

                {
                    this.props.editMode &&
                    <div className="undo-redo">
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('navbar.undo')}>
                            <button type="button" className="btn btn-neutral"
                                style={{
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0
                                }}
                                disabled={!this.props.undoRedo?.canUndo}
                                onClick={this.props.undoRedo?.undo}>
                                <FontAwesomeIcon icon={faReply} size="xl" color="#fff" />
                            </button>
                        </div>
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('navbar.redo')}>
                            <button type="button" className="btn btn-neutral"
                                style={{
                                    borderLeft: 'none',
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0
                                }}
                                disabled={!this.props.undoRedo?.canRedo}
                                onClick={this.props.undoRedo?.redo}>
                                <FontAwesomeIcon icon={faShare} size="xl" color="#fff" />
                            </button>
                        </div>
                    </div>
                }

                <div className="ms-auto flex items-center gap-2">
                    <Exporter translate={this.props.t}
                        selectedProject={this.props.selectedProject}
                        exportIIIF={this.props.exportIIIF} />

                    <div className="tooltip tooltip-bottom z-50 ms-auto" data-tip={this.props.editMode ? this.props.t('navbar.edit_project') : this.props.t('navbar.show_metadatas')}>
                        <button
                            onClick={() => this.props.showProjectMetadatas()}
                            className="btn navbar-button"
                            title={this.props.editMode ? this.props.t('navbar.edit_project') : this.props.t('navbar.show_metadatas')}>
                            <FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} size="xl" />
                        </button>
                    </div>

                    {
                        process.env.ADNO_MODE === "FULL" &&
                        <>

                            {
                                !this.props.editMode &&
                                <button onClick={() => this.props.showEditorSettings()} className="btn navbar-button">
                                    <FontAwesomeIcon icon={faGear} size="xl" />
                                </button>
                            }


                            <div className="tooltip tooltip-bottom z-50"
                                data-tip={this.props.editMode ? this.props.t('navbar.edit_mode_help') : this.props.t('navbar.view_mode_help')}>
                                <div className="cursor-pointer label-toggle">
                                    <input type="checkbox"
                                        className="toggle toggle-lg toggle-success" value={this.props.editMode}
                                        onChange={() => {

                                            // Turn off autoplay
                                            if (this.props.autoplayID !== -1) {
                                                clearTimeout(this.props.autoplayID)
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
                                    <label style={{
                                        right: this.props.editMode ? 0 : 'initial',
                                        left: this.props.editMode ? 'initial' : 0,
                                        paddingLeft: this.props.editMode ? 0 : '1rem',
                                        paddingRight: !this.props.editMode ? 0 : '1rem'
                                    }}>{this.props.editMode ? this.props.t('navbar.edit_mode') : this.props.t('navbar.view_mode')}</label>
                                </div>
                            </div>
                        </>
                    }
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter(Navbar));