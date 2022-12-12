import Swal from "sweetalert2"
import { buildJsonProjectWithManifest, generateUUID, get_url_extension, insertInLS, isJsonString } from "../../../Utils/utils"

export async function manageUrls(props, url) {

    // We check if the url contains an image
    if (get_url_extension(url) === "png" || get_url_extension(url) === "jpg" || get_url_extension(url) === "jpeg") {
        fetch(url)
            .then(res => {
                if (res.status == 200 || res.status == 201) {
                    insertInLS("adno_image_url", url)
                    props.history.push("/new")
                } else {
                    throw new Error("Impossible d'accéder à ce fichier")
                }
            })
            .catch(err => {
                Swal.fire({
                    title: `Erreur détectée : ${err.message}`,
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
                    throw new Error(`Error ${res.status}`)
                }
            })
            .then((data) => {
                    let manifest = JSON.parse(data)

                    if (manifest.format && manifest.format === "Adno") {
                        insertInLS("adno_image_url", url)

                        Swal.fire({
                            title: "Projet ADNO détecté, voulez-vous l'importer ?",
                            showCancelButton: true,
                            showConfirmButton: true,
                            confirmButtonText: 'OK',
                            cancelButtonText: "Annuler",
                            icon: 'info'
                        })
                            .then((result) => {
                                if (result.isConfirmed) {
                                    let projectID = generateUUID();

                                    let project = buildJsonProjectWithManifest(projectID, manifest.label, manifest.subject, manifest.source)

                                    // Création du projet dans le localStorage
                                    insertInLS(projectID, JSON.stringify(project))

                                    // Insertion de l'ID du projet créé dans le tableau des projets
                                    projects = JSON.parse(localStorage.getItem("adno_projects"))
                                    projects.push(projectID)
                                    insertInLS("adno_projects", JSON.stringify(projects))


                                    insertInLS(`${projectID}_annotations`, JSON.stringify(manifest.first.items))

                                    // remove current url
                                    localStorage.removeItem("adno_image_url")

                                    Swal.fire({
                                        title: "Projet importé avec succès",
                                        showCancelButton: false,
                                        showConfirmButton: true,
                                        confirmButtonText: 'OK',
                                        icon: 'success'
                                    })
                                        .then((result) => {
                                            if (result.isConfirmed) {
                                                props.history.push("/")
                                            }
                                        })


                                }
                            })


                    } else {
                        // format non ADNO

                        if ((manifest.hasOwnProperty("@context") || manifest.hasOwnProperty("context")) && (manifest.hasOwnProperty("@id") || manifest.hasOwnProperty("id"))) {
                            insertInLS("adno_image_url", url)
                            props.history.push("/new")

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
                                        props.history.push("/")
                                    }
                                })
                        }

                    }
            })
            .catch(err => {
                Swal.fire({
                    title: "Impossible de traiter l'url fournie : Format du fichier invalide",
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