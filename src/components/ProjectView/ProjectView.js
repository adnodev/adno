import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome icons
import { faCopy, faDownload, faEye, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Import popup alerts
import Swal from 'sweetalert2';

// Import utils
import { deleteProject, createExportProjectJsonFile, duplicateProject, getAllProjectsFromLS, enhancedFetch, insertInLS, migrateTextBody, buildJsonProjectWithManifest, getProjectSettings } from "../../Utils/utils";

// Import CSS
import "./ProjectView.css";

// Add Internationalization
import { withTranslation } from "react-i18next";
import { Exporter, ExporterModal } from "../Exporter/Exporter";
import { exportToIIIF } from "../../services/iiif/exporter";

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
            enhancedFetch(this.props.project.manifest_url)
                .then(rep => rep.response.json())
                .then(async manifest => {
                    if (manifest?.format === 'Adno') {
                        await this.migrateAdnoProject(this.props.project.id, manifest)
                    }

                    this.loadSourceImage(manifest)

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

    migrateAdnoProject = async (projectID, manifest) => {
        try {
            const title = manifest.title || manifest.label
            const desc = manifest.description || manifest.subject

            const project = buildJsonProjectWithManifest(projectID, title, desc, manifest.source)
            insertInLS(projectID, JSON.stringify(project))
            insertInLS(`${projectID}_annotations`, JSON.stringify(manifest.first.items))

            // Migrate annotations if there is only TextualBody and not HTMLBody
            manifest.first.items?.forEach(annotation => {
                if (annotation.body.find(annoBody => annoBody.type === "TextualBody") && !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
                    migrateTextBody(projectID, annotation)
                }
            })
        } catch (err) {
            console.log(err)
        }
    }

    loadSourceImage = manifest => {
        const isVersion2 = manifest["@context"] && manifest["@context"].includes("2");

        const id = isVersion2 ? manifest["@id"] : manifest["id"];

        if (manifest["sizes"] && manifest["sizes"].length > 0) {
            let sizes = manifest["sizes"]
                .filter(a => a.width < 1300)
                .sort((a, b) => b.width - a.width);

            if (sizes.length <= 0)
                sizes = manifest["sizes"]
                    .sort((a, b) => b.width - a.width)

            const largestSize = sizes[0];

            const manifestWidth = largestSize.width;
            const manifestHeight = largestSize.height;

            this.setState({
                imgWidth: manifestWidth,
                imgSource: `${id}/full/${manifestWidth},${manifestHeight}/0/default.jpg`,
            });
        } else if (manifest["tiles"] && manifest["tiles"][0]) {
            // For both versions: Handle "tiles" array
            this.setState({
                imgWidth: manifest["tiles"][0].width,
                imgSource: `${id}/full/${manifest["tiles"][0].width},/0/default.jpg`,
            });
        } else if (manifest["height"] && manifest["width"] && id) {
            // For both versions: Handle height and width directly in the manifest
            this.setState({
                imgWidth: manifest["width"],
                imgSource: `${id}/full/${manifest["width"]},${manifest["height"]}/0/default.jpg`,
            });
        } else if (manifest["thumbnail"] && Array.isArray(manifest["thumbnail"]) && manifest["thumbnail"][0].id) {
            // For v3: Handle "thumbnail" array with "id" field
            this.setState({
                imgWidth: 250, // Default thumbnail width
                imgSource: manifest["thumbnail"][0].id,
            });
        } else if (isVersion2 && manifest.sequences && manifest.sequences[0] && manifest.sequences[0].canvases) {
            // For v2: Handle "sequences" and "canvases"
            const canvas = manifest.sequences[0].canvases[0]; // Assuming we use the first canvas
            const imageAnnotation = canvas.images && canvas.images[0];
            const imageResource = imageAnnotation && imageAnnotation.resource;
            const imageService = imageResource && imageResource.service;

            if (imageService && imageService["@id"]) {
                const serviceId = imageService["@id"];
                this.setState({
                    imgWidth: 300, // Default width for fallback
                    imgSource: `${serviceId}/full/300,/0/default.jpg`,
                });
            } else {
                console.error("Image service information is missing in IIIF v2 manifest.");
            }
        } else if (manifest["@id"] && isVersion2) {
            // For v2: Handle Image API 1.1 manifests with "@id"
            this.setState({
                imgWidth: 250,
                imgSource: `${manifest["@id"]}/full/,250/0/native.jpg`,
            });
        } else if (manifest["@context"] === "http://library.stanford.edu/iiif/image-api/1.1/context.json") {
            // For v2: Handle Image API 1.1 specifically
            this.setState({
                imgWidth: 250,
                imgSource: `${manifest["@id"]}/full/,250/0/native.jpg`,
            });
        } else if (this.props.project.manifest_url && this.props.project.manifest_url.includes("info.json")) {
            // Fallback: Use "info.json" URL
            this.setState({
                imgWidth: 250,
                imgSource: this.props.project.manifest_url.replace("info.json", "") + "/full/,250/0/native.jpg",
            });
        } else if (id) {
            // Final fallback: Handle missing tiles but with valid ID
            this.setState({
                imgWidth: 250,
                imgSource: `${id}/full/,250/0/native.jpg`,
            });
        } else {
            // If all else fails, log an error
            console.error("Unable to retrieve source image. Manifest is missing required fields.");
        }

    }

    deleteProj = (projID) => {
        Swal.fire({
            title: this.props.t('modal.delete_project'),
            showCancelButton: true,
            confirmButtonText: this.props.t('modal.confirm_delete'),
            cancelButtonText: this.props.t('modal.cancel'),
            icon: 'warning',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProject(projID)
                Swal.fire(this.props.t('modal.projects_list_up_to_date'), '', 'success')
                    .then((result) => {
                        var projects = getAllProjectsFromLS()
                        result.isConfirmed && this.props.updateProjectsList(projects)
                    })
            }
        })
    }

    duplicate = (projID) => {
        Swal.fire({
            title: this.props.t('modal.duplicate_project'),
            showCancelButton: true,
            confirmButtonText: this.props.t('modal.confirm_duplication'),
            cancelButtonText: this.props.t('modal.cancel'),
            icon: 'warning',
        }).then((result) => {
            if (result.isConfirmed) {
                duplicateProject(projID, this.props.t('project.copy'))
                Swal.fire(this.props.t('modal.projects_list_up_to_date'), '', 'success')
                    .then((result) => {
                        var projects = getAllProjectsFromLS()
                        result.isConfirmed && this.props.updateProjectsList(projects)
                    })
            }
        })
    }

    render() {
        const annotations = JSON.parse(localStorage.getItem(`${this.props.project.id}_annotations`)) || [];

        const exportedProject = {
            annotations,
            selectedProject: this.props.project,
            settings: getProjectSettings(this.props.project.id)
        }

        return <>
            <ExporterModal
                translate={this.props.t}
                selectedProject={this.props.project}
                exportIIIF={() => exportToIIIF(exportedProject)} />

            <div className="card card-side bg-base-100 shadow-xl project-view-card">
                <div className="project-card-img" onClick={() => this.props.history.push(`/project/${this.props.project.id}/view`)}>
                    <img
                        src={this.state.imgSource}
                        onError={({ currentTarget }) => {
                            currentTarget.onerror = null; // prevents looping
                            currentTarget.src = "https://www.pngkey.com/png/detail/212-2124171_404-error-404-pagina-no-encontrada.png"
                        }}
                        className="img-fluid img-proj-view " alt={this.props.project.title} />
                </div>
                <div className="project-card-body">
                    <div className="project-text">
                        <h2 className="card-title">{this.props.project.title}</h2>
                        <p className="card-text card-date"><small className="text-muted">{this.props.project.creator ? this.props.project.creator : this.props.t('project.no_creator')} — {this.props.project.editor ? this.props.project.editor : this.props.t('project.no_editor')}</small></p>
                        <p className="card-text line-clamp-3 mb-2">{this.props.project.description ? this.props.project.description : this.props.t('project.no_desc')}</p>
                        <p className="card-text card-date"><small className="text-muted">{this.props.t('project.created_on')} {new Date(this.props.project.creation_date).toLocaleDateString()} — {this.props.t('project.last_update')}  {new Date(this.props.project.last_update).toLocaleDateString()}</small></p>
                        <p className="card-text"><small className="text-muted"> <span className="badge badge-lg">{this.state.nbAnnotations} annotation{this.state.nbAnnotations > 1 && "s"}</span> </small></p>
                    </div>
                    <div className="project_vw_btns">
                        <div className="tooltip" data-tip={this.props.t('project.preview')}>
                            <button type="button" className="btn btn-md" onClick={() => this.props.history.push(`/project/${this.props.project.id}/view`)}> <FontAwesomeIcon icon={faEye} />   </button>
                        </div>
                        {
                            process.env.ADNO_MODE === "FULL" &&
                            <div className="tooltip" data-tip={this.props.t('project.edit')}>
                                <button type="button" className="btn btn-md" onClick={() => this.props.history.push(`/project/${this.props.project.id}/edit`)}> <FontAwesomeIcon icon={faPenToSquare} /> </button>
                            </div>
                        }
                        <div className="tooltip" data-tip={this.props.t('project.duplicate')}>
                            <button type="button" className="btn btn-md btn-outline"
                                onClick={() => this.duplicate(this.props.project.id)}><FontAwesomeIcon icon={faCopy} /></button>
                        </div>
                        <div className="tooltip" data-tip={this.props.t('project.download')}>
                            <Exporter
                                translate={this.props.t}
                                selectedProject={this.props.project}
                                exportIIIF={() => exportToIIIF(exportedProject)}
                                separatedModal
                                btn={<>
                                    <button type="button" className="btn btn-md btn-outline me-2" onClick={() => {
                                        document.getElementById('my-modal').click()
                                    }}>
                                        <label htmlFor="my-modal" style={{ pointerEvents: 'none' }}>
                                            <FontAwesomeIcon icon={faDownload} />
                                        </label>
                                    </button>
                                </>}
                            />
                        </div>
                        <div className="tooltip" data-tip={this.props.t('project.delete')}>
                            <button type="button" className="btn btn-md btn-outline btn-error" onClick={() => this.deleteProj(this.props.project.id)}>    <FontAwesomeIcon icon={faTrash} />  </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    }
}

export default withTranslation()(withRouter(ProjectView));
