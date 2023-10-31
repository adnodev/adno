import Swal from "sweetalert2"
import { buildJsonProjectWithManifest, generateUUID, get_url_extension, insertInLS, migrateTextBody } from "../../Utils/utils";

export async function manageUrls(props, url, translation) {
    const IPFS_GATEWAY = process.env.IPFS_GATEWAY
    const GRANTED_IMG_EXTENSIONS = process.env.GRANTED_IMG_EXTENSIONS.split(",")

    // We check if the url is an IPFS CID, version 0 or version 1
    // CIDv0 CIDs are 46 characters long and start with the characters “Qm”
    // hashes are encoded with base58btc
    // CIDv1 CIDs start with a multibase prefix indicating which encoding method was used  
    // we only test base32 which is used by default by IPFS 
    const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;
    if (url.match(regexCID)) url = IPFS_GATEWAY + url;

    // We check if the url contains an image
    if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(url))) {
        fetch(url)
            .then(res => {
                if (res.status == 200 || res.status == 201) {
                    insertInLS("adno_image_url", url)
                    localStorage.removeItem("selected_canva")
                    props.history.push("/new")
                } else {
                    throw new Error(translation('errors.unable_access_file'))
                }
            })
            .catch(err => {
                Swal.fire({
                    title: err.message,
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    icon: 'error'
                })
                    .then((result) => {
                        if (result.isConfirmed) {
                            props.history.push("/")
                        }
                    })
            })
    } else {
        fetch(url)
            .then(res => {
                if (res.status == 200 || res.status == 201) {
                    return res.text()
                } else {
                    throw new Error(`${translation('errors.wrong_url')}: ${url}`,)
                }
            })
            .then((data) => {
                let manifest = JSON.parse(data)

                // If we detect an ADNO project, we import it to the user's projects

                if (manifest.format && manifest.format === "Adno") {
                    Swal.fire({
                        title: translation('modal.adno_proj_detected'),
                        showCancelButton: true,
                        showConfirmButton: true,
                        confirmButtonText: 'OK',
                        cancelButtonText: "Annuler",
                        icon: 'info'
                    })
                        .then((result) => {
                            if (result.isConfirmed) {
                                let projectID = generateUUID();

                                let title = manifest.title || manifest.label
                                let desc = manifest.description || manifest.subject

                                let project = buildJsonProjectWithManifest(projectID, title, desc, manifest.source)

                                // Création du projet dans le localStorage
                                insertInLS(projectID, JSON.stringify(project))

                                // Insertion de l'ID du projet créé dans le tableau des projets
                                let projects = JSON.parse(localStorage.getItem("adno_projects"))
                                projects.push(projectID)
                                insertInLS("adno_projects", JSON.stringify(projects))


                                insertInLS(`${projectID}_annotations`, JSON.stringify(manifest.first.items))

                                // Migrate annotations if there is only TextualBody and not HTMLBody
                                manifest.first.items?.forEach(annotation => {
                                    if (annotation.body.find(annoBody => annoBody.type === "TextualBody") && !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
                                        migrateTextBody(projectID, annotation)
                                    }
                                })

                                Swal.fire({
                                    title: translation('import.import_success'),
                                    showCancelButton: false,
                                    showConfirmButton: true,
                                    confirmButtonText: 'OK',
                                    icon: 'success'
                                })
                                    .then((result) => {
                                        if (result.isConfirmed) {
                                            props.history.push(`/project/${projectID}/edit`)
                                        }
                                    })
                            } else if (result.isDismissed) {
                                props.history.push("/")
                            }
                        })


                } else {
                    // Non-ADNO Format detected
                    if ((manifest.hasOwnProperty("@context") || manifest.hasOwnProperty("context")) && (manifest.hasOwnProperty("@id") || manifest.hasOwnProperty("id"))) {
                        insertInLS("adno_image_url", url)
                        localStorage.removeItem("selected_canva")
                        props.history.push("/new")
                    } else {
                        Swal.fire({
                            title: translation('errors.no_iiif'),
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'OK',
                            icon: 'error'
                        })
                            .then((result) => {
                                if (result.isConfirmed) {
                                    props.history.push("/")
                                }
                            })
                    }

                }
            })
            .catch(() => {
                Swal.fire({
                    title: `${translation('errors.wrong_url')}: ${url}`,
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    icon: 'error',
                })
                    .then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = ""
                        }
                    })
            })

    }
}
