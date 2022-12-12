import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome icons
import { faCopy, faDownload, faEye, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Import popup alerts
import Swal from 'sweetalert2';

// Import utils
import { insertInLS, createExportProjectJsonFile, duplicateProject } from "../../../Utils/utils";

// Import CSS
import "./ProjectView.css";

class ProjectView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nbAnnotations: 0,
            imgSource: "",
            imgWidth: 0
        }
    }

    componentDidMount() {
        if (this.props.project.manifest_url) {
            fetch(this.props.project.manifest_url)
                .then(rep => rep.json())
                .then(manifest => {
                    if (manifest["@id"] && manifest["sizes"] && manifest["sizes"].length > 0) {

                        let manifestHeight = manifest["sizes"].sort((a, b) => b.width - a.width)[0].height
                        var manifestWidth = manifest["sizes"].sort((a, b) => b.width - a.width)[0].width

                        this.setState({ imgWidth: manifest["sizes"].sort((a, b) => b.width - a.width)[0].width })
                        this.setState({ imgSource: manifest["@id"] + "/full/" + manifestWidth + "," + manifestHeight + "/0/default.jpg" })
                    } else if (manifest["@id"] && manifest["tiles"] && manifest["tiles"][0]) {
                        this.setState({ imgWidth: manifest["tiles"][0].width })
                        this.setState({ imgSource: manifest["@id"] + "/full/" + manifest["tiles"][0].width + ",/0/default.jpg" })
                    } else if (manifest["id"] && manifest["tiles"]) {
                        this.setState({ imgWidth: manifest["tiles"][0].width })
                        this.setState({ imgSource: manifest["id"] + "/full/" + manifest["tiles"][0].width + ",/0/default.jpg" })
                    } else if (manifest["@id"] && manifest["@context"] && manifest["@context"] === "http://library.stanford.edu/iiif/image-api/1.1/context.json") {
                        this.setState({ imgWidth: 250 })
                        this.setState({ imgSource: manifest["@id"] + "/full/,250/0/native.jpg" })
                    } else if (this.props.project.manifest_url.indexOf("info.json") !== -1) {
                        this.setState({ imgWidth: 250 })
                        this.setState({ imgSource: this.props.project.manifest_url.replace("info.json", "") + "/full/,250/0/native.jpg" })
                    }
                    else if (manifest["@id"] && !manifest["tiles"]) {
                        this.setState({ imgWidth: 250 })
                        this.setState({ imgSource: manifest["@id"] + "/full/,250/0/native.jpg" })
                    }

                    if (localStorage.getItem(this.props.project.id + "_annotations")) {
                        let nbAnnotations = JSON.parse(localStorage.getItem(this.props.project.id + "_annotations")).length
                        this.setState({ nbAnnotations })
                    }
                })

        } else if (this.props.project.img_url) {
            this.setState({ imgSource: this.props.project.img_url })

            if (localStorage.getItem(`${this.props.project.id}_annotations`)) {
                let nbAnnotations = (JSON.parse(localStorage.getItem(this.props.project.id + "_annotations")) && JSON.parse(localStorage.getItem(this.props.project.id + "_annotations")).length) || 0
                this.setState({ nbAnnotations })
            }
        }
    }

    render() {
        function deleteProject(idProject) {

            // First, remove all the annotations linked to the selected projet
            localStorage.removeItem(idProject + "_annotations")

            // Then , delete the projet 
            localStorage.removeItem(idProject)

            // Finaly, remove the project id from the adno projects list
            let projects = JSON.parse(localStorage.getItem("adno_projects"))

            let newProjectsList = projects.filter(id_p => id_p !== idProject)

            insertInLS("adno_projects", JSON.stringify(newProjectsList))
        }

        function deleteProj(projID) {
            Swal.fire({
                title: 'Voulez-vous vraiment supprimer ce projet ?',
                showCancelButton: true,
                confirmButtonText: 'Supprimer mon projet',
                cancelButtonText: 'Annuler',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteProject(projID)
                    Swal.fire('La liste des projets a bien été mise à jour !', '', 'success')
                        .then((result) => {
                            result.isConfirmed ? window.location.reload() : ""
                        })
                }
            })
        }

        function duplicate(projID) {
            Swal.fire({
                title: 'Voulez-vous vraiment dupliquer ce projet ?',
                showCancelButton: true,
                confirmButtonText: 'Dupliquer mon projet',
                cancelButtonText: 'Annuler',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    duplicateProject(projID)
                    Swal.fire('La liste des projets a bien été mise à jour !', '', 'success')
                        .then((result) => {
                            result.isConfirmed ? window.location.reload() : ""
                        })
                }
            })
        }

        return (
            <div className="card card-side bg-base-100 shadow-xl project-view-card" style={{ "width": "80%" }}>
                <div className="project-card-img" onClick={() => this.props.history.push("/project/" + this.props.project.id)}>
                    <img src={this.state.imgSource} onError={({ currentTarget }) => {
                        currentTarget.onerror = null; // prevents looping
                        currentTarget.src = "https://www.pngkey.com/png/detail/212-2124171_404-error-404-pagina-no-encontrada.png"
                    }} className="img-fluid img-proj-view " alt={this.props.project.title} />


                </div>
                <div className="card-body">
                    <h2 className="card-title">{this.props.project.title}</h2>
                    <p className="card-text">{this.props.project.description ? this.props.project.description : "Aucune description disponible pour ce projet"}</p>
                    <p className="card-text"><small className="text-muted">Créé le {new Date(this.props.project.creation_date).toLocaleDateString()}</small></p>
                    <p className="card-text"><small className="text-muted">Dernière mise à jour le  {new Date(this.props.project.last_update).toLocaleDateString()}</small></p>
                    <p className="card-text"><small className="text-muted">  <span className="badge badge-primary badge-lg">{this.state.nbAnnotations > 0 ? this.state.nbAnnotations : "Aucune"} annotation{this.state.nbAnnotations > 1 && "s"}</span> </small></p>


                    <div className="project_vw_btns">


                        <div className="tooltip" data-tip="Prévisualiser">
                            <button type="button" className="btn btn-md btn-primary" onClick={() => this.props.history.push(`/project/${this.props.project.id}/view`)}> <FontAwesomeIcon icon={faEye} />   </button>
                        </div>

                        {
                            process.env.ADNO_MODE === "FULL" &&
                            <div className="tooltip" data-tip="Editer">
                                <button type="button" className="btn btn-md btn-primary" onClick={() => this.props.history.push(`/project/${this.props.project.id}/edit`)}> <FontAwesomeIcon icon={faPenToSquare} /> </button>
                            </div>
                        }

                        <div className="tooltip" data-tip="Supprimer">
                            <button type="button" className="btn btn-md btn-outline btn-error" onClick={() => deleteProj(this.props.project.id)}>    <FontAwesomeIcon icon={faTrash} />  </button>
                        </div>
                        <div className="tooltip" data-tip="Dupliquer">
                            <button type="button" className="btn btn-md btn-outline btn-info" onClick={() => duplicate(this.props.project.id)}><FontAwesomeIcon icon={faCopy} /></button>
                        </div>

                        <div className="tooltip" data-tip="Télécharger">
                            <a id={"download_btn_" + this.props.project.id} href={createExportProjectJsonFile(this.props.project.id)} download={this.props.project.title + ".json"} className="btn btn-md btn-outline btn-success"> <FontAwesomeIcon icon={faDownload} />  </a>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(ProjectView)