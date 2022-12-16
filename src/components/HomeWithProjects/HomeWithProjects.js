import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome and icons
import { faAdd, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import popup alerts
import Swal from "sweetalert2";

// Import utils
import { getAllProjectsFromLS, insertInLS, isValidUrl } from "../../Utils/utils";

// Import components
import ImportProject from "../ImportProject/ImportProject";
import ProjectsList from "../ProjectsList/ProjectsList";

// Import CSS
import "./HomeWithProjects.css";

class HomeWithProjects extends Component {
    constructor(props) {
        super(props);
        this.state = {
            adno_image_url: "",
            projects: []
        }
    }

    componentDidMount() {
        // Get projects from localStorage
        var projects = getAllProjectsFromLS()

        this.setState({ projects })
    }

    render() {
        // Create function which is called when clicking on the submit button
        const newProject = (e) => {
            e.preventDefault()

            // Also, we check if the url is not empty, not undefined and not null
            if (this.state.adno_image_url) {

                // Then, we check if the given URL is valid
                // Finally, we check if the URL is reachable
                if (isValidUrl(this.state.adno_image_url)) {

                    fetch(this.state.adno_image_url)
                        .then(rep => {
                            if (rep.status === 200 || rep.status === 302) {
                                insertInLS("adno_image_url", this.state.adno_image_url)

                                this.props.history.push("/new");
                            } else {
                                throw new Error(rep.status)
                            }
                        })
                        .catch(error => {
                            Swal.fire({
                                title: `Erreur - Manifest ou image introuvable`,
                                showCancelButton: true,
                                showConfirmButton: false,
                                cancelButtonText: 'OK',
                                icon: 'warning',
                            })
                        })
                } else {
                    Swal.fire({
                        title: "L'URL renseignée n'est pas valide !",
                        showCancelButton: true,
                        showConfirmButton: false,
                        cancelButtonText: 'OK',
                        icon: 'warning',
                    })
                }

            } else {
                // Display a warning popup if the URL is not filled
                Swal.fire({
                    title: 'Veuillez renseigner une URL valide',
                    showCancelButton: true,
                    showConfirmButton: false,
                    cancelButtonText: 'OK',
                    icon: 'warning',
                })
            }
        }

        return (
            <div>
                <div id="container_with_projects" className="adno_container">

                    <h1>{process.env.ADNO_TITLE ? process.env.ADNO_TITLE : "ADNO BETA"}</h1>
                    <p>Pour commencer à utiliser Adno, veuillez renseigner dans le champs ci-dessous l'URL d'un manifest IIIF, d'une image IIIF ou encore d'une image statique au format JPG ou PNG</p>

                    <form id="myForm">
                        <div className="input-group mb-3 add_url">
                            <span className="input-group-text" id="basic-addon1"> <FontAwesomeIcon icon={faLink} /> URL</span>
                            <input type="text" id="adno_image_url_2" className="input input-bordered input-primary w-full" value={this.state.adno_image_url} onChange={(e) => this.setState({ adno_image_url: e.target.value })}
                                placeholder="https://free.iiifhosting.com/iiif/1c8d49343676a04fffcd92979c02e9394e48bac96f590fffbadffc9133cd06b9/info.json" />
                        </div>

                        <div className="tooltip" data-tip="Créer un nouveau projet">
                            <button id="create_project_2" type="submit" className="btn btn-success" onClick={(e) => newProject(e)}> <FontAwesomeIcon icon={faAdd} /> </button>
                        </div>

                        <ImportProject projects={this.state.projects} updateProjects={(updatedList) => this.setState({ projects: updatedList, adno_image_url: "" })} />
                    </form>


                    {
                        this.state.projects && this.state.projects.length > 0 ?
                            <>
                                <h2>Vos Projets</h2>
                                <ProjectsList projects={this.state.projects} updateProjects={(updatedProjects) => this.setState({ projects: updatedProjects })} />
                            </>
                            :
                            <p>Aucun projet disponible pour le moment</p>
                    }



                </div>

                {
                    process.env.ADNO_FOOTER === "TRUE" &&
                    <footer className="footer footer-center p-4 bg-base-300 text-base-content">
                        <div>
                            {
                                process.env.ADNO_FOOTER_TEXT ?
                                    <p>{process.env.ADNO_FOOTER_TEXT}</p>
                                    : <p><a href="https://adno.app/" target="_blank">adno.app</a> - <a href="https://emf.fr/" target="_blank">Espace Mendès France</a>, Poitiers. Ce projet a été soutenu par le ministère de la Culture français.</p>
                            }
                        </div>
                    </footer>
                }

            </div>

        )
    }
}

export default withRouter(HomeWithProjects);