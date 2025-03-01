import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome and icons
import { faAdd, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import popup alerts
import Swal from "sweetalert2";

// Import utils
import { checkOldVersion, getAllProjectsFromLS } from "../../Utils/utils";
import { manageUrls } from "../AdnoUrls/manageUrls";

// Import components
import ImportProject from "../ImportProject/ImportProject";
import ProjectsList from "../ProjectsList/ProjectsList";

// Import CSS
import "./Home.css";

// Add translations
import { withTranslation } from "react-i18next";

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            url: "",
            projects: [],
            loading: false
        }
    }

    componentDidMount() {
        // Get projects from localStorage
        var projects = getAllProjectsFromLS()

        this.setState({ projects })

        checkOldVersion(this.props.t)
    }

    createNewProject = (e) => {
        e.preventDefault()

        this.setState({ loading: true }, () => {
            // First, we have to check if the url is not empty, not undefined and not null
            if (this.state.url) {
                try {
                    manageUrls(this.props, this.state.url, this.props.t)
                        .catch(message => {
                            Swal.fire({
                                title: this.props.t('errors.wrong_url'),
                                showCancelButton: true,
                                showConfirmButton: false,
                                cancelButtonText: 'OK',
                                icon: 'warning',
                            })
                        })
                        .finally(() => this.setState({ loading: false }))
                } catch (err) {
                    this.setState({ loading: false })
                    alert(err)
                }

            } else {
                // Display a warning popup if the URL is not filled
                Swal.fire({
                    title: this.props.t('errors.wrong_url'),
                    showCancelButton: true,
                    showConfirmButton: false,
                    cancelButtonText: 'OK',
                    icon: 'warning',
                })
                this.setState({ loading: false })
            }
        })
    }


    render() {
        // Create function which is called when clicking on the submit button
        return (
            <div className="home">
                <div id="container_with_projects" className="adno_container">
                    {
                        process.env.ADNO_TITLE ? <h1>{process.env.ADNO_TITLE}</h1> : ``
                    }
                    {
                        <div className="adno_title">
                            <h1>ADNO</h1>
                            <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">BETA</div>
                        </div>
                    }
                    <p className="adno_description">{this.props.t('begin_msg')}</p>
                    <div className="adno_home_selection">
                        <form id="myForm">
                            <div className="input-group mb-3 add_url">
                                <span className="input-group-text" id="basic-addon1"> <FontAwesomeIcon icon={faLink} /> URL </span>
                                <input type="text" id="adno_image_url_2" className="input input-bordered w-full" value={this.state.url} onChange={(e) => this.setState({ url: e.target.value })}
                                    placeholder="https://iiif.emf.fr/iiif/3/saint-savin.jpg/info.json" />
                            </div>
                            <div className="home-btn-container">
                                <div className="tooltip" data-tip={this.props.t('project.new_tooltip')}>
                                    <button className="create_project_2 btn" type="submit" onClick={(e) => this.createNewProject(e)} disabled={this.state.loading}>
                                        <FontAwesomeIcon icon={faAdd} className={this.state.loading ? 'spin' : ''} />
                                        {this.props.t('project.new')}
                                    </button>
                                </div>
                            </div>
                        </form>
                        <div className="import_container">
                            <p className="adno_import_description mb-3">{this.props.t('import.import_now')}</p>
                            <ImportProject projects={this.state.projects} updateProjects={(updatedList) => this.setState({ projects: updatedList, adno_image_url: "" })} />
                        </div>
                    </div>
                    <div className="projects_list__container">
                        {
                            this.state.projects && this.state.projects.length > 0 ?
                                <>
                                    <h2 className="projects_list__title">{this.props.t('projects.all')}</h2>
                                    <ProjectsList projects={this.state.projects} updateProjects={(updatedProjects) => this.setState({ projects: updatedProjects })} />
                                </>
                                :
                                <p className="text-center">{this.props.t('projects.nothing')}</p>
                        }
                    </div>

                </div>

                {
                    process.env.ADNO_FOOTER === "TRUE" ?
                        <footer className="footer footer-center bg-base-300 text-base-content p-2">
                            {process.env.ADNO_FOOTER_TEXT ?
                                <p>{process.env.ADNO_FOOTER_TEXT}</p>
                                : <p><a href="https://adno.app/" target="_blank">adno.app</a></p>}
                            <p>Version 1.0.0</p>
                        </footer>

                        : <footer className="footer footer-center bg-base-300 text-base-content">
                            <p className="text-center py-2">Version 1.0.0</p>
                        </footer>}

            </div>

        )
    }
}

export default withTranslation()(withRouter(Home));
