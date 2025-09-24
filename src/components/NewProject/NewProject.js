import { Component } from "react";
import { withRouter } from "react-router";
import ProjectSettings from "../Project/ProjectSettings";

// Import utils
import { insertInLS, buildJsonProjectWithImg, buildJsonProjectWithManifest, get_url_extension, generateUUID, enhancedFetch, defaultProjectSettings, diffProjectSettings } from "../../Utils/utils";

// Import popup alerts
import Swal from "sweetalert2";

// Import CSS
import "./NewProject.css"

// Add translation
import { withTranslation } from "react-i18next";
import ProjectEditMetadatas from "../Project/ProjectEditMetadatas/ProjectEditMetadatas";

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
            isCanvaProject: false,
            selectedImg: undefined,
            showSettings: false,
            showMetadatas: false,
            metadatas: {},
            settings: defaultProjectSettings(),
            projectName: "",
            projectDesc: ""
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

        enhancedFetch(manifest_url)
            .then(rep => rep.response.json())
            .then(manifestIIIF => {

                const context = manifestIIIF['@context'];

                if (context === "http://iiif.io/api/presentation/3/context.json") {
                    this.loadManifestV3(manifestIIIF)
                } else {
                    this.loadManifestV2(manifestIIIF)
                }
            })
    }

    loadManifestV3 = manifestIIIF => {
        // @id => id
        // @type => type
        // description => summary

        if (manifestIIIF.items && manifestIIIF.items.length > 0) {
            manifestIIIF.items.forEach((canva, index) => {
                if (canva.items && canva.items.length > 0) {
                    const annotation = canva.items[0];

                    const resource = annotation.items[0].body

                    if (resource) {
                        if (resource.service && resource.service[0] && resource.service[0].id) {
                            const originalImgLink = `${resource.service[0].id}/full/300,/0/default.jpg`;
                            const manifestURL = `${resource.service[0].id}/info.json`;

                            const canvaData = {
                                thumbnail_link: originalImgLink,
                                canva_url: manifestURL,
                            };

                            this.setState((prevState) => ({
                                manifestImages: [...prevState.manifestImages, canvaData],
                                currentIndex: 0,
                                nbCanvases: manifestIIIF.items.length,
                                isCanvaProject: true,
                            }));
                        } else {
                            console.error("Resource service ID not found for canvas ", index);
                        }
                    }
                } else if (canva.thumbnail && canva.thumbnail[0] && canva.thumbnail[0].id) {
                    const imgLink = canva.thumbnail[0].id;
                    const manifestURL = canva.id ? `${canva.id}/info.json` : null;

                    const canvaData = {
                        thumbnail_link: imgLink,
                        canva_url: manifestURL,
                    };

                    this.setState((prevState) => ({
                        manifestImages: [...prevState.manifestImages, canvaData],
                        currentIndex: 0,
                        nbCanvases: manifestIIIF.items.length,
                        isCanvaProject: true,
                    }));
                } else {
                    console.log("No valid resource or thumbnail found for canvas ", index);
                }
            });
        } else {
            console.error("No canvases found in the manifest.");
        }

    }

    loadManifestV2 = manifestIIIF => {
        if (manifestIIIF.sequences && manifestIIIF.sequences[0] && manifestIIIF.sequences[0].canvases) {

            // Get all canvases from the manifest
            manifestIIIF.sequences[0].canvases.forEach((canva, index) => {

                if (canva.images) {
                    if ((canva.images[0].resource.service && canva.images[0].resource.service["@id"]) ||
                        canva.images[0].resource["@id"]) {

                        const id = (canva.images[0].resource.service && canva.images[0].resource.service["@id"]) ? canva.images[0].resource.service["@id"] :
                            canva.images[0].resource["@id"];

                        const originalImgLink = id + "/full/300,/0/default.jpg"

                        const manifestURL = id + "/info.json"

                        let newCanva = {
                            thumbnail_link: originalImgLink,
                            canva_url: manifestURL
                        }

                        if (!(canva.images[0].resource.service && canva.images[0].resource.service["@id"]) && canva.images[0].resource["@id"]) {
                            newCanva = {
                                thumbnail_link: originalImgLink,
                                img_url: canva.images[0].resource["@id"]
                            }
                        }

                        this.setState({
                            manifestImages: [...this.state.manifestImages, newCanva],
                            currentIndex: 0,
                            nbCanvases: manifestIIIF.sequences[0].canvases.length,
                            isCanvaProject: true
                        })

                    } else if (canva.images[0].resource.default && canva.images[0].resource.default.service && canva.images[0].resource.default.service["@id"]) {

                        var originalImgLink = canva.images[0].resource.default.service["@id"] + "/full/300,/0/default.jpg"
                        let manifestURL = canva.images[0].resource.default.service["@id"] + "/info.json"

                        canva = {
                            "thumbnail_link": originalImgLink,
                            "canva_url": manifestURL
                        }

                        this.setState({
                            manifestImages: [...this.state.manifestImages, canva],
                            currentIndex: 0,
                            nbCanvases: manifestIIIF.sequences[0].canvases.length,
                            isCanvaProject: true
                        })

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

                        this.setState({
                            manifestImages: [...this.state.manifestImages, canva],
                            currentIndex: 0,
                            nbCanvases: manifestIIIF.sequences[0].canvases.length,
                            isCanvaProject: true
                        })

                    } else {
                        console.error("Resource not found ", index);
                    }
                } else {
                    console.log("nothing found");
                }
            });
        }
    }


    isManifest = async (url) => {
        return new Promise((resolve, reject) => {
            enhancedFetch(url)
                .then(rawResponse => {
                    const res = rawResponse.response
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

        if (this.state.projetcName === "") {
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
                let project = buildJsonProjectWithManifest(projectID,
                    this.state.projetcName,
                    this.state.projectDesc, selected_canva)

                project = {
                    ...project,
                    ...this.state.metadatas
                }
                project.settings = this.state.settings

                if (this.state.selectedImg) {
                    project.img_url = this.state.selectedImg
                    project.manifest_url = undefined
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


                if (process.env.ADNO_MODE === "FULL") {
                    this.props.history.push("/project/" + projectID + "/edit")
                } else {
                    this.props.history.push("/project/" + projectID + "/view")
                }

                localStorage.removeItem("selected_canva")
                localStorage.removeItem("adno_image_url")
            } else {

                var manifest_url = localStorage.getItem("adno_image_url")
                const isIpfsUrl = manifest_url.startsWith(process.env.IPFS_GATEWAY);

                // let isUrlManifest = "";

                // if the url is not an image file (.jpg, .jpeg or .png) it should be a manifest
                // if (!isIpfsUrl && !GRANTED_IMG_EXTENSIONS.includes(get_url_extension(manifest_url))) {
                //     isUrlManifest = await this.isManifest(manifest_url)
                // }

                var projectID = generateUUID()


                try {
                    if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(manifest_url)) || isIpfsUrl) {

                        let project = buildJsonProjectWithImg(projectID, this.state.projetcName, this.state.projectDesc, manifest_url)
                        project = {
                            ...project,
                            ...this.state.metadatas
                        }
                        project.settings = this.state.settings

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
                        enhancedFetch(manifest_url)
                            .then(rawResponse => {
                                const rep = rawResponse.response

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

                                                project = buildJsonProjectWithManifest(projectID, projectName, projectDesc, resultLink)
                                                project = {
                                                    ...project,
                                                    ...this.state.metadatas
                                                }
                                                project.settings = this.state.settings

                                            } else {
                                                project = buildJsonProjectWithManifest(projectID, projectName, projectDesc, manifest_url)
                                                project = {
                                                    ...project,
                                                    ...this.state.metadatas
                                                }
                                                project.settings = this.state.settings
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

                } catch (err) {
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

    handleProjectName = e => {
        this.setState({
            projectName: e.target.value,
            metadatas: {
                ...this.state.metadatas,
                title: e.target.value
            }
        })
    }

    handleProjectDescription = e => {
        this.setState({
            projectDesc: e.target.value,
            metadatas: {
                ...this.state.metadatas,
                description: e.target.value
            }
        })
    }

    render() {
        const overloadedSettings = diffProjectSettings(this.state.settings, defaultProjectSettings())

        console.log(this.state)

        return (
            <div className="new-project">
                {this.state.showSettings && <ProjectSettings
                    settings={this.state.settings}
                    updateSettings={settings => this.setState({ settings })}
                    closeSettings={() => this.setState({ showSettings: false })}
                    annotations={[]}
                />}

                {this.state.showMetadatas && <ProjectEditMetadatas
                    newProject
                    updateProject={(metadatas) => {
                        this.setState({
                            metadatas,
                            showMetadatas: false,
                            projectName: metadatas.title || "",
                            projectDesc: metadatas.description || "",
                        })
                    }}
                    selectedProject={this.state.metadatas}
                    closeProjectMetadatas={() => this.setState({ showMetadatas: false })} />}

                {
                    (!this.state.isCanvaProject || (this.state.isCanvaProject && this.state.selectedCanva)) &&
                    <>
                        <h1 className="new-project-title">{this.props.t('new_project.add_info')}</h1>
                        <form className="form-new-project" >
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.title')}</span>
                                <input
                                    onChange={this.handleProjectName}
                                    value={this.state.projectName}
                                    className="input input-bordered w-full"
                                    type="text"
                                    placeholder={this.props.t('project.add_title')} />
                            </label>
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.description')}</span>
                                <input
                                    onChange={this.handleProjectDescription}
                                    value={this.state.projectDesc}
                                    className="input input-bordered w-full"
                                    type="text"
                                    placeholder={this.props.t('project.add_desc')} />
                            </label>
                            <label className="input-group new_project_input">
                                <span className="new_project_span">{this.props.t('project.manifest_url')}</span>
                                <input id="manifest_url" className="input input-bordered w-full" value={localStorage.getItem("adno_image_url")} type="text" disabled={true} />
                            </label>
                            <div className="input-group new_project_input mb-3">
                                <span className="new_project_span">{this.props.t('project.advanced')}</span>
                                <div className="w-full">
                                    <button className="btn btn-outline ms-2" onClick={() => {
                                        this.setState({ showSettings: true })
                                    }}>Options {Object.keys(overloadedSettings).length > 0 ? `(${Object.keys(overloadedSettings).length})` : ''}</button>
                                    <button className="btn btn-outline ms-2" onClick={() => {
                                        this.setState({ showMetadatas: true })
                                    }}>{this.props.t('navbar.all_metadata')}</button>
                                </div>
                            </div>
                            <div className="new_project_btns">
                                <button id="valider_creation" type="submit" className="btn" onClick={(e) => this.createProj(e)}>{this.props.t('project.create')}</button>


                                {
                                    this.state.isCanvaProject && this.state.selectedCanva &&
                                    <button id="annuler_creation" type="submit" className="btn btn-outline" onClick={() => {
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
                        <h1>{this.props.t('project.choose')}</h1>
                        <p className="adno_description">{this.props.t('project.choose_desc')}</p>
                    </>
                }


                {
                    this.state.manifestImages && this.state.nbCanvases > 0 &&
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
                    this.state.manifestImages && this.state.nbCanvases > 0 && this.state.currentIndex !== -1 && !this.state.selectedCanva &&
                    <button className="btn btn-success my-2" onClick={() => {
                        this.setState({ selectedCanva: true, isCanvaProject: true })

                        const canva = this.state.manifestImages[this.state.currentIndex]
                        if (canva.img_url)
                            this.setState({ selectedImg: canva.img_url })

                        localStorage.setItem("selected_canva", canva.img_url ? canva.img_url : canva.canva_url)
                    }}>{this.props.t('project.choose_canva')}</button>
                }


                {
                    this.state.isCanvaProject && !this.state.selectedCanva &&
                    <button id="cancel_creation" type="submit" className="btn"
                        onClick={() => { localStorage.removeItem("adno_image_url"), this.props.history.push("/") }}>
                        {this.props.t('project.back_home')}
                    </button>
                }

            </div>
        )
    }
}

export default withTranslation()(withRouter(NewProject))