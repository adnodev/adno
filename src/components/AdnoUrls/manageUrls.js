import Swal from "sweetalert2"
import { buildJsonProjectWithManifest, enhancedFetch, generateUUID, get_url_extension, insertInLS, migrateTextBody } from "../../Utils/utils";

function isJsonContentType(contentType) {
    const jsonPattern = /^(application\/(vnd\.api\+json|ld\+json|x-json-stream|json)(;.*)?|text\/json)$/i;
    return jsonPattern.test(contentType.trim()) || contentType === 'application/octet-stream';
}

export async function manageUrls(props, url, translation, step = "decoreURIComponent") {
    const IPFS_GATEWAY = process.env.IPFS_GATEWAY

    // We check if the url is an IPFS CID, version 0 or version 1
    // CIDv0 CIDs are 46 characters long and start with the characters “Qm”
    // hashes are encoded with base58btc
    // CIDv1 CIDs start with a multibase prefix indicating which encoding method was used  
    // we only test base32 which is used by default by IPFS 
    const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;

    const isIpfsUrl = url.match(regexCID) || url.startsWith(IPFS_GATEWAY);
    if (isIpfsUrl && !url.startsWith(IPFS_GATEWAY)) url = IPFS_GATEWAY + url;

    if (url.startsWith('http') || url.startsWith("https")) {
        console.log('call with', step === "decoreURIComponent" ? decodeURIComponent(url) : url)
        return enhancedFetch(step === "decoreURIComponent" ? decodeURIComponent(url) : url)
            .then(rawReponse => {
                if (rawReponse.response.ok) {
                    const { response } = rawReponse
                    const contentType = response.headers.get('Content-Type')

                    if (isJsonContentType(contentType)) {
                        response.text()
                            .then(data => {
                                let manifest = JSON.parse(data)

                                // If we detect an ADNO project, we import it to the user's projects

                                if (manifest.metadata && manifest.metadata.find(meta => meta.label.en?.includes('adno_settings'))) {
                                    readProjectFromIIIFFormat(props, manifest, translation)
                                }
                                else if (manifest.format && manifest.format === "Adno") {
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
                                        insertInLS("adno_image_url", rawReponse.url)
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
                            .catch(_err => {
                                if (step === "decoreURIComponent") {
                                    return manageUrls(props, url, translation, "rawURL")
                                }
                            })
                    } else {
                        insertInLS("adno_image_url", rawReponse.url)
                        localStorage.removeItem("selected_canva")
                        props.history.push("/new")
                    }
                } else {
                    return Promise.reject(translation('errors.unable_access_file'))
                }
            })
    } else {
        return Promise.reject(`${translation('errors.wrong_url')}: ${url}`)
    }
    // .catch(() => {
    //     Swal.fire({
    //         title: `${translation('errors.wrong_url')}: ${url}`,
    //         showCancelButton: false,
    //         showConfirmButton: true,
    //         confirmButtonText: 'OK',
    //         icon: 'error',
    //     })
    //         .then((result) => {
    //             if (result.isConfirmed) {
    //                 window.location.href = ""
    //             }
    //         })
    // })
}

export function readProjectFromIIIFFormat(props, manifest, translation) {
    try {
        const metadata = manifest.metadata.find(meta => meta.label.en?.includes('adno_settings'))
        const settings = JSON.parse(atob(metadata.value.en[0]));

        const projectID = generateUUID();

        let title = manifest.title

        if (!title) {
            if (typeof manifest.label === 'object' && manifest.label !== null) {
                title = String(manifest.label.en[0] || manifest.label.fr[0])
            } else {
                title = String(manifest.label)
            }
        }

        const desc = manifest.description || manifest.subject

        let manifestURL = manifest.items[0]?.items[0].items[0].body.id

        if (!manifestURL.endsWith('/info.json'))
            manifestURL = `${manifestURL}/info.json`

        const project = {
            ...buildJsonProjectWithManifest(projectID, title, desc, manifestURL),
            settings
        }
        insertInLS(projectID, JSON.stringify(project))

        const projects = JSON.parse(localStorage.getItem("adno_projects"))
        projects.push(projectID)
        insertInLS("adno_projects", JSON.stringify(projects))

        // insertInLS(`${projectID}_annotations`, JSON.stringify(manifest.items[0]?.annotations[0].items.map(annotation => ({
        //     "@context": "http://www.w3.org/ns/anno.jsonld",
        //     body: Array.isArray(annotation.body) ? annotation.body : [annotation.body],
        //     target: annotation.target,
        //     id: annotation.id,
        //     type: 'Annotation'
        // }))))

        const annotations = manifest.items[0]?.annotations[0].items.flatMap(annotation => {
            if (annotation.body)
                return {
                    // "@context": "http://www.w3.org/ns/anno.jsonld",
                    body: Array.isArray(annotation.body) ? annotation.body : [annotation.body],
                    target: buildAnnotationTarget(annotation.target),
                    id: annotation.id,
                    type: 'Annotation'
                }
            else if (annotation.items) {
                return annotation.items.map(item => ({
                    ...item,
                    body: Array.isArray(item.body) ? item.body : [item.body],
                    target: buildAnnotationTarget(item.target),
                }))
            }
        })

        insertInLS(`${projectID}_annotations`, JSON.stringify(annotations))

        props.history.push(`/project/${projectID}/edit`)
    } catch (err) {
        console.log(err)
        return Promise.reject(translation('errors.unable_access_file'))
    }
}

function buildAnnotationTarget(target) {

    if (typeof target === 'string') {
        // "https://example.com/canvas-1#xywh=1415,406,334,626"
        return {
            type: "SpecificResource",
            // source: "https://example.com/canvas-1",
            selector: {
                type: "FragmentSelector",
                value: target.split('#')[1].replace('xywh=', 'xywh=pixel:'),
                conformsTo: "http://www.w3.org/TR/media-frags/"
            }
        }
    } else if (target?.selector?.type === 'FragmentSelector') {
        return {
            ...target,
            selector: {
                ...target.selector,
                conformsTo: "http://www.w3.org/TR/media-frags/"
            }
        }
    }
    return target
}
