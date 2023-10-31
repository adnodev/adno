import { Component } from "react";
import { withRouter } from "react-router";

// Import utils
import { insertInLS, buildJsonProjectWithImg, buildJsonProjectWithManifest, get_url_extension, generateUUID } from "../../Utils/utils";

// Import popup alerts
import Swal from "sweetalert2";

// Import CSS
import "./NewProject.css"

// Add translation
import { withTranslation } from "react-i18next";

class NewProject extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            manifestImages: [],
            currentIndex: -1,
            nbCanvases: 0,
            selectedCanva: false,
            images: [],
            isCanvaProject: false
        }
    }

    componentDidMount() {
        // Checking if there is an url inserted in the localStorage
        if (!localStorage.getItem("adno_image_url")) {
            this.props.history.push("/")
        }

        if (localStorage.getItem("selected_canva")) {
            this.setState({ selectedCanva: true, isCanvaProject: true })
        }

        var manifest_url = localStorage.getItem("adno_image_url")
        fetch(manifest_url)
            .then(rep => rep.json())
            .then(manifestIIIF => {
                if (manifestIIIF.sequences && manifestIIIF.sequences[0] && manifestIIIF.sequences[0].canvases) {

                    // Get all canvases from the manifest
                    manifestIIIF.sequences[0].canvases.forEach((canva, index) => {

                        if (canva.images) {
                            if (canva.images[0].resource.service && canva.images[0].resource.service["@id"]) {

                                var originalImgLink = canva.images[0].resource.service["@id"] + "/full/300,/0/default.jpg"
                                var manifestURL = canva.images[0].resource.service["@id"] + "/info.json"

                                canva = {
                                    "thumbnail_link": originalImgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length, isCanvaProject: true })

                            } else if (canva.images[0].resource.default && canva.images[0].resource.default.service && canva.images[0].resource.default.service["@id"]) {

                                var originalImgLink = canva.images[0].resource.default.service["@id"] + "/full/300,/0/default.jpg"
                                let manifestURL = canva.images[0].resource.default.service["@id"] + "/info.json"

                                canva = {
                                    "thumbnail_link": originalImgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length, isCanvaProject: true })

                            } else {
                                console.error("Resource not found ", index);
                            }

                        } else if (canva.thumbnail) {
                            if (canva.images[0].resource.service && canva.images[0].resource.service["@id"]) {

                                let imgLink = canva.thumbnail["@id"]
                                let manifestURL = canva.images[0].resource.service["@id"] + "/info.json"

                                canva = {
                                    "thumbnail_link": imgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length, isCanvaProject: true })

                            } else {
                                console.error("Resource not found ", index);
                            }
                        } else {
                            console.log("nothing found");
                        }
                    });
                }
            })
    }


    isManifest = async (url) => {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(res => {
                    if (res.status == 200 || res.status == 201) {
                        return res.text()
                    } else {
                        reject(res.status)
                    }
                })
                .then((data) => {
                    return resolve(data ? JSON.parse(data) : {})
                })
                .catch(err => {
                    Swal.fire({
                        title: this.props.t('errors.wrong_url'),
                        showCancelButton: false,
                        showConfirmButton: true,
                        confirmButtonText: 'OK',
                        icon: 'error',
                    })
                        .then((result) => {
                            if (result.isConfirmed) {
                                localStorage.removeItem("adno_image_url")
                                window.location.href = "/"
                            }
                        })
                })
        })
    }


    createProj = async (e) => {
        e.preventDefault()

        if (document.getElementById("project_name").value === "") {
            Swal.fire({
                title: this.props.t('errors.no_title'),
                showCancelButton: true,
                showConfirmButton: false,
                cancelButtonText: 'OK',
                icon: 'warning',
            })
        } else {
            this.setState({ isLoading: true })
            const GRANTED_IMG_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS.split(",")

            var selected_canva = localStorage.getItem("selected_canva")
            if (selected_canva) {

                const projectID = generateUUID()
                let project = buildJsonProjectWithManifest(projectID, document.getElementById("project_name").value, document.getElementById("project_desc").value, selected_canva)

                if (localStorage.getItem("adno_projects") === undefined || localStorage.getItem("adno_projects") === null) {

                    // If projects in local storage don't exist create the array
                    var projects = []
                    projects.push(projectID)

                    // Création du projet dans le localStorage
                    insertInLS(projectID, JSON.stringify(project))

                    // Insertion de l'ID du projet créé dans le tableau des projets
                    insertInLS("adno_projects", JSON.stringify(projects))
                } else {

                    // Création du projet dans le localStorage
                    insertInLS(projectID, JSON.stringify(project))

                    // Insertion de l'ID du projet créé dans le tableau des projets
                    projects = JSON.parse(localStorage.getItem("adno_projects"))
                    projects.push(projectID)
                    insertInLS("adno_projects", JSON.stringify(projects))
                }


                if (process.env.ADNO_MODE === "FULL") {
                    this.props.history.push("/project/" + projectID + "/edit")
                } else {
                    this.props.history.push("/project/" + projectID + "/view")
                }

                localStorage.removeItem("selected_canva")
                localStorage.removeItem("adno_image_url")
            } else {

                var manifest_url = localStorage.getItem("adno_image_url")

                let isUrlManifest = "";

                // if the url is not an image file (.jpg, .jpeg or .png) it should be a manifest
                if (!GRANTED_IMG_EXTENSIONS.includes(get_url_extension(manifest_url))) {
                    isUrlManifest = await this.isManifest(manifest_url)
                }

                var projectID = generateUUID()

                // we check if the url is an image (.jpg, .jpeg or .png) or a manifest or a json file (such as an info.json file)
                if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(manifest_url)) || get_url_extension(manifest_url) === "json" || isUrlManifest["@type"] && isUrlManifest["@type"] === "sc:Manifest") {
                    // fichier accepté

                    if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(manifest_url))) {

                        let project = buildJsonProjectWithImg(projectID, document.getElementById("project_name").value, document.getElementById("project_desc").value, manifest_url)

                        if (localStorage.getItem("adno_projects") === undefined || localStorage.getItem("adno_projects") === null) {

                            // If projects in local storage don't exist create the array
                            var projects = []
                            projects.push(projectID)

                            // Création du projet dans le localStorage
                            insertInLS(projectID, JSON.stringify(project))

                            // Insertion de l'ID du projet créé dans le tableau des projets
                            insertInLS("adno_projects", JSON.stringify(projects))
                        } else {

                            // Création du projet dans le localStorage
                            insertInLS(projectID, JSON.stringify(project))

                            // Insertion de l'ID du projet créé dans le tableau des projets
                            projects = JSON.parse(localStorage.getItem("adno_projects"))
                            projects.push(projectID)
                            insertInLS("adno_projects", JSON.stringify(projects))
                        }

                        localStorage.removeItem("adno_image_url")

                        if (process.env.ADNO_MODE === "FULL") {
                            this.props.history.push("/project/" + projectID + "/edit")
                        } else {
                            this.props.history.push("/project/" + projectID + "/view")
                        }

                    } else {
                        fetch(manifest_url)
                            .then(rep => {
                                if (rep.status === 200) {

                                    rep.json().then(manifest => {


                                        if ((manifest.hasOwnProperty("@context") || manifest.hasOwnProperty("context")) && (manifest.hasOwnProperty("@id") || manifest.hasOwnProperty("id"))) {


                                            let project;

                                            if (manifest["@type"] && manifest["@type"] === "sc:Manifest") {
                                                // type manifest

                                                if (manifest.sequences[0].canvases && manifest.sequences[0].canvases.length > 0) {
                                                    var resultLink = manifest.sequences[0].canvases[0].images[0].resource.service["@id"] + "/info.json"
                                                } else if (manifest.logo["@id"]) {
                                                    var resultLink = manifest.logo["@id"].split("/")[0] + "//"

                                                    for (let index = 1; index < manifest.logo["@id"].split("/").length - 4; index++) {
                                                        resultLink += manifest.logo["@id"].split("/")[index] + "/";
                                                    }

                                                    resultLink += "/info.json"
                                                } else {
                                                    Swal.fire({
                                                        title: this.props.t('errors.unable_reading_manifest'),
                                                        showCancelButton: true,
                                                        showConfirmButton: false,
                                                        cancelButtonText: 'OK',
                                                        icon: 'warning',
                                                    })
                                                }

                                                project = buildJsonProjectWithManifest(projectID, document.getElementById("project_name").value, document.getElementById("project_desc").value, resultLink)

                                            } else {
                                                project = buildJsonProjectWithManifest(projectID, document.getElementById("project_name").value, document.getElementById("project_desc").value, manifest_url)
                                            }


                                            if (localStorage.getItem("adno_projects") === undefined || localStorage.getItem("adno_projects") === null) {

                                                // If projects in local storage don't exist create the array
                                                var projects = []
                                                projects.push(projectID)


                                                // Création du projet dans le localStorage
                                                insertInLS(projectID, JSON.stringify(project))

                                                // Insertion de l'ID du projet créé dans le tableau des projets
                                                insertInLS("adno_projects", JSON.stringify(projects))
                                            } else {

                                                // Création du projet dans le localStorage
                                                insertInLS(projectID, JSON.stringify(project))

                                                // Insertion de l'ID du projet créé dans le tableau des projets
                                                projects = JSON.parse(localStorage.getItem("adno_projects"))
                                                projects.push(projectID)
                                                insertInLS("adno_projects", JSON.stringify(projects))
                                            }

                                            localStorage.removeItem("adno_image_url")

                                            // Remove the current selected canva after creating the project
                                            localStorage.removeItem("selected_canva")
                                            if (process.env.ADNO_MODE === "FULL") {
                                                this.props.history.push("/project/" + projectID + "/edit")
                                            } else {
                                                this.props.history.push("/project/" + projectID + "/view")
                                            }
                                        } else {
                                            Swal.fire({
                                                title: this.props.t('errors.no_iiif'),
                                                showCancelButton: false,
                                                showConfirmButton: true,
                                                confirmButtonText: 'OK',
                                                icon: 'error'
                                            })
                                                .then((result) => {
                                                    if (result.isConfirmed) {
                                                        this.props.history.push("/")
                                                    }
                                                })
                                        }

                                    })

                                } else {
                                    this.setState({ isLoading: false })
                                    Swal.fire({
                                        title: this.props.t('errors.unable_reading_manifest'),
                                        showCancelButton: true,
                                        showConfirmButton: false,
                                        cancelButtonText: 'OK',
                                        icon: 'warning',
                                    })
                                }
                            })
                    }

                } else {
                    this.setState({ isLoading: false })
                    Swal.fire({
                        title: this.props.t('errors.unable_reading_file'),
                        showCancelButton: true,
                        showConfirmButton: false,
                        cancelButtonText: 'OK',
                        icon: 'warning',
                    })
                }
            }
        }
    }

    render() {
        return (
            <div className="new-project">

                {
                    (!this.state.isCanvaProject || (this.state.isCanvaProject && this.state.selectedCanva)) &&
                    <>
                        <h1 className="new-project-title">{this.props.t('new_project.add_infos_1')}<br></br> {this.props.t('new_project.add_infos_2')}</h1>
                        <form className="form-new-project" >
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.title')}</span>
                                <input id="project_name" className="input input-bordered w-full" type="text" placeholder={this.props.t('project.add_title')} />
                            </label>
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.description')}</span>
                                <input id="project_desc" className="input input-bordered w-full" type="text" placeholder={this.props.t('project.add_desc')} />
                            </label>
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.manifest_url')}</span>
                                <input id="manifest_url" className="input input-bordered w-full" value={localStorage.getItem("adno_image_url")} type="text" disabled={true} />
                            </label>
                            <div className="new_project_btns">
                                <button id="valider_creation" type="submit" className="btn" onClick={(e) => this.createProj(e)}>{this.props.t('project.create')}</button>


                                {
                                    this.state.isCanvaProject && this.state.selectedCanva &&
                                    <button id="annuler_creation" type="submit" className="btn" onClick={() => {
                                        this.setState({ selectedCanva: false, isCanvaProject: true })
                                        localStorage.removeItem("selected_canva")
                                    }}>{this.props.t('project.back')}</button>
                                }


                                {
                                    !this.state.isCanvaProject &&
                                    <button id="cancel_creation" type="submit" className="btn" onClick={() => { localStorage.removeItem("adno_image_url"), this.props.history.push("/") }}>{this.props.t('project.cancel')}</button>
                                }

                            </div>
                        </form>
                    </>
                }


                {
                    this.state.isCanvaProject && !this.state.selectedCanva && this.state.manifestImages && this.state.nbCanvases > 1 &&
                    <>
                        <h1>Choisissez une image</h1>
                        <p className="adno_description">Ce manifest comporte plusieurs images, vous devez en choisir une pour votre projet Adno</p>
                    </>
                }


                {
                    this.state.manifestImages && this.state.nbCanvases > 1 &&
                    <div id="select_canva">

                        {
                            this.state.manifestImages && this.state.manifestImages.length > 0 && this.state.currentIndex > 0 && !this.state.selectedCanva &&
                            <button onClick={() => this.setState({ currentIndex: this.state.currentIndex - 1 })} className="btn btn-circle">❮</button>
                        }

                        {
                            this.state.manifestImages && this.state.manifestImages.length > 0 && !this.state.selectedCanva &&
                            <img src={this.state.manifestImages[this.state.currentIndex].thumbnail_link}></img>
                        }

                        {
                            this.state.manifestImages && this.state.currentIndex < this.state.nbCanvases - 1 && !this.state.selectedCanva &&

                            <button onClick={() => this.setState({ currentIndex: this.state.currentIndex + 1 })} className="btn btn-circle">❯</button>
                        }
                    </div>
                }


                {
                    this.state.manifestImages && this.state.nbCanvases > 1 && this.state.currentIndex !== -1 && !this.state.selectedCanva &&
                    <button className="btn btn-success" onClick={() => {
                        this.setState({ selectedCanva: true, isCanvaProject: true })
                        localStorage.setItem("selected_canva", this.state.manifestImages[this.state.currentIndex].canva_url)
                    }
                    }>{this.props.t('project.choose_canva')}</button>
                }


                {
                    this.state.isCanvaProject && !this.state.selectedCanva &&
                    <button id="cancel_creation" type="submit" className="btn" onClick={() => { localStorage.removeItem("adno_image_url"), this.props.history.push("/") }}>{this.props.t('project.back_home')}</button>
                }

            </div>
        )
    }
}

export default withTranslation()(withRouter(NewProject))