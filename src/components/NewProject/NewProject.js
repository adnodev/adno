import { Component } from "react";
import { withRouter } from "react-router";

// Import utils
import { insertInLS, buildJsonProjectWithImg, buildJsonProjectWithManifest, get_url_extension, generateUUID } from "../../Utils/utils";

// Import popup alerts
import Swal from "sweetalert2";

// Import CSS
import "./NewProject.css"

class NewProject extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            manifestImages: [],
            currentIndex: -1,
            nbCanvases: 0,
            selectedCanva: false,
            projectName: "",
            projectDesc: ""
        }
    }

    componentDidMount() {
        // Checking if there is an url inserted in the localStorage
        if (!localStorage.getItem("adno_image_url")) {
            this.props.history.push("/")
        }

        var manifest_url = localStorage.getItem("adno_image_url")
        fetch(manifest_url)
            .then(rep => rep.json())
            .then(manifestIIIF => {
                if (manifestIIIF.sequences && manifestIIIF.sequences[0] && manifestIIIF.sequences[0].canvases) {
                    console.log(manifestIIIF.sequences[0].canvases.length, "annotations trouvées");
                    console.log(manifestIIIF.sequences[0].canvases);

                    manifestIIIF.sequences[0].canvases.forEach((canva, index) => {

                        if (canva.images) {
                            console.log("images found");


                            // let img_child = document.createElement("img")
                            // img_child.src= canva.images[0].resource.service["@id"] + "/full/111,/0/default.jpg"


                            if (canva.images[0].resource.service && canva.images[0].resource.service["@id"]) {

                                let imgLink = canva.images[0].resource.service["@id"] + "/full/111,/0/default.jpg"
                                let manifestURL = canva.images[0].resource.service["@id"] + "/info.json"

                                canva = {
                                    "thumbnail_link": imgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length })

                            } else if (canva.images[0].resource.default && canva.images[0].resource.default.service && canva.images[0].resource.default.service["@id"]) {
                                canva.images[0].resource.default.service["@id"]

                                let imgLink = canva.images[0].resource.default.service["@id"] + "/full/111,/0/default.jpg"
                                let manifestURL = canva.images[0].resource.default.service["@id"] + "/info.json"


                                canva = {
                                    "thumbnail_link": imgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length })

                            }
                            else {
                                console.error("Resource not found ", index);
                            }
                            // document.getElementById("imgs_manifest").appendChild(img_child)

                        }else if (canva.thumbnail) {
                            console.log("thumbnail found");


                            // let img_child = document.createElement("img")
                            // img_child.src = canva.thumbnail["@id"]

                            if (canva.images[0].resource.service && canva.images[0].resource.service["@id"]) {

                                let imgLink = canva.thumbnail["@id"]
                                let manifestURL = canva.images[0].resource.service["@id"] + "/info.json"



                                canva = {
                                    "thumbnail_link": imgLink,
                                    "canva_url": manifestURL
                                }

                                this.setState({ manifestImages: [...this.state.manifestImages, canva], currentIndex: 0, nbCanvases: manifestIIIF.sequences[0].canvases.length })

                            }

                            else {
                                console.error("Resource not found ", index);
                            }


                            // document.getElementById("imgs_manifest").appendChild(img_child)

                        } 
                        
                        
                        else {
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
                        title: "Impossible de traiter l'url fournie",
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

        if (!this.state.projectName) {
            Swal.fire({
                title: "Veuillez renseigner un titre à votre projet",
                showCancelButton: true,
                showConfirmButton: false,
                cancelButtonText: 'OK',
                icon: 'warning',
            })
        } else {

            if (this.state.nbCanvases !== 1 && !this.state.selectedCanva) {
                console.log(this.state.nbCanvases);
                console.log(this.state.selectedCanva);
                alert("Veuillez choisir un canva")
            } else {



                this.setState({ isLoading: true })

                var manifest_url = localStorage.getItem("adno_image_url")



                let isUrlManifest = "";

                // if the url is not an image file (.jpg, .jpeg or .png) it should be a manifest
                if (get_url_extension(manifest_url) !== "png" && get_url_extension(manifest_url) !== "jpg" && get_url_extension(manifest_url) !== "jpeg") {
                    isUrlManifest = await this.isManifest(manifest_url)
                }

                var projectID = generateUUID()

                // we check if the url is an image (.jpg, .jpeg or .png) or a manifest or a json file (such as an info.json file)
                if (get_url_extension(manifest_url) === "png" || get_url_extension(manifest_url) === "jpg" || get_url_extension(manifest_url) === "jpeg" || get_url_extension(manifest_url) === "json" || isUrlManifest["@type"] && isUrlManifest["@type"] === "sc:Manifest") {
                    // fichier accepté

                    if (get_url_extension(manifest_url) === "png" || get_url_extension(manifest_url) === "jpg" || get_url_extension(manifest_url) === "jpeg") {

                        let project = buildJsonProjectWithImg(projectID, this.state.projectName, this.state.projectDesc, manifest_url)

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
                                                        title: "Impossible de lire le manifest",
                                                        showCancelButton: true,
                                                        showConfirmButton: false,
                                                        cancelButtonText: 'OK',
                                                        icon: 'warning',
                                                    })
                                                }

                                                resultLink = this.state.manifestImages[this.state.currentIndex].canva_url
                                                console.log("oui resultLink", resultLink);



                                                project = buildJsonProjectWithManifest(projectID, this.state.projectName, this.state.projectDesc, resultLink)

                                            } else {
                                                project = buildJsonProjectWithManifest(projectID, this.state.projectName, this.state.projectDesc, manifest_url)
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
                                            if (process.env.ADNO_MODE === "FULL") {
                                                this.props.history.push("/project/" + projectID + "/edit")
                                            } else {
                                                this.props.history.push("/project/" + projectID + "/view")
                                            }
                                        } else {
                                            Swal.fire({
                                                title: "Projet non IIIF détecté, veuillez renseigner un projet IIIF",
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
                                        title: "Impossible de lire le manifest",
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
                        title: "Impossible de lire ce fichier, veuillez renseigner un fichier ayant un des formats suivant : png, jpg, json",
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
            <>
                <form className="form-new-project" >

                    <label className="input-group new_project_input">
                        <span className="new_project_span">Titre</span>
                        <input onChange={(e) => this.setState({ projectName: e.target.value })} value={this.state.projectName} className="input input-bordered w-full" type="text" placeholder="Donnez un titre à votre projet" />
                    </label>

                    <label className="input-group new_project_input">
                        <span className="new_project_span">Description</span>
                        <input onChange={(e) => this.setState({ projectDesc: e.target.value })} value={this.state.projectDesc} className="input input-bordered w-full" type="text" placeholder="Description de votre projet" />
                    </label>

                    <label className="input-group new_project_input">
                        <span className="new_project_span">URL du Manifest</span>
                        <input id="manifest_url" className="input input-bordered w-full" value={localStorage.getItem("adno_image_url")} type="text" disabled={true} />
                    </label>


                    <div className="new_project_btns">
                        <button id="annuler_creation" type="submit" className="btn btn-error" onClick={() => { localStorage.removeItem("adno_image_url"), this.props.history.push("/") }}>Annuler</button>
                        <button id="valider_creation" type="submit" className="btn btn-success" onClick={(e) => this.createProj(e)}>Créer mon projet</button>
                    </div>
                </form>


                {
                    this.state.manifestImages && this.state.nbCanvases > 1 &&

                    <div id="imgs_manifest">
                        {
                            this.state.manifestImages && this.state.manifestImages.length > 0 && this.state.currentIndex > 0 &&
                            <button onClick={() => this.setState({ currentIndex: this.state.currentIndex - 1 })}>BACK </button>
                        }

                        {
                            this.state.manifestImages && this.state.manifestImages.length > 0 &&
                            <img src={this.state.manifestImages[this.state.currentIndex].thumbnail_link}></img>
                        }

                        {
                            this.state.manifestImages && this.state.currentIndex < this.state.nbCanvases - 1 &&

                            <button onClick={() => this.setState({ currentIndex: this.state.currentIndex + 1 })}>NEXT </button>
                        }

                    </div>
                }


                {
                    this.state.manifestImages && this.state.nbCanvases > 1 && this.state.currentIndex !== -1 && !this.state.selectedCanva &&
                    <button onClick={() => this.setState({ selectedCanva: true })}>Valider mon choix</button>
                }

            </>
        )
    }
}

export default withRouter(NewProject)