import Swal from "sweetalert2"
import { buildJsonProjectWithManifest, enhancedFetch, migrateTextBody } from "../../Utils/utils";
import { projectDB } from "../../services/db";
import { withImages } from "../../Utils/images"
import { extractLanguageValue } from "../AdnoEmbed/IIIFHelper"
import { v7 } from 'uuid'


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
        // console.log('call with', step === "decoreURIComponent" ? decodeURIComponent(url) : url)
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
                                                let projectID = v7()

                                                let title = manifest.title || manifest.label
                                                let desc = manifest.description || manifest.subject

                                                let base = buildJsonProjectWithManifest(projectID, title, desc, manifest.source)
                                                let project = manifest.images && manifest.images.length > 0
                                                    ? withImages(base, manifest.images)
                                                    : base

                                                projectDB.add(projectID, {
                                                    id: projectID,
                                                    ...project,
                                                    annotations: manifest.first.items.map(annotation => {
                                                        if (annotation.body.find(annoBody => annoBody.type === "TextualBody") &&
                                                            !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
                                                            return migrateTextBody(projectID, annotation)
                                                        }
                                                        return annotation
                                                    })
                                                }).then(() => {

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
                                                })
                                            } else if (result.isDismissed) {
                                                props.history.push("/")
                                            }
                                        })
                                } else {
                                    // Non-ADNO Format detected
                                    if ((manifest.hasOwnProperty("@context") || manifest.hasOwnProperty("context")) && (manifest.hasOwnProperty("@id") || manifest.hasOwnProperty("id"))) {
                                        localStorage.setItem("adno_image_url", rawReponse.url)
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
                        localStorage.setItem("adno_image_url", rawReponse.url)
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
}

export function readProjectFromIIIFFormat(props, manifest, translation) {
    try {
        const metadata = manifest.metadata.find(meta => meta.label.en?.includes('adno_settings'))
        const settings = JSON.parse(atob(metadata.value.en[0]));

        const projectID = v7()

        let title = manifest.title

        if (!title) {
            if (typeof manifest.label === 'object' && manifest.label !== null && 
                (manifest.label.en[0] || manifest.label.fr[0])
            ) {
                title = String(manifest.label.en[0] || manifest.label.fr[0])
            } else {
                const titleFromMetadata = manifest.metadata.find(meta => meta.label.en?.includes('title'))
                if (titleFromMetadata) {
                    title = titleFromMetadata.value.en[0]
                } else {
                    title = String(manifest.label)
                }
            }
        }

        const desc = manifest.description || manifest.subject

        const canvases = (manifest.items || [])
            .map(canvas => ({ canvas, image: canvasImage(canvas) }))
            .filter(entry => entry.image)

        const sourceByCanvas = new Map(canvases.map(({ canvas, image }) => [canvas.id, image.source]))

        const images = canvases.map(({ canvas, image }) => ({
            ...image,
            id: canvas.id,
            label: extractLanguageValue(canvas.label) || ''
        }))

        const project = withImages({
            ...buildJsonProjectWithManifest(projectID, title, desc, images[0]?.source),
            settings
        }, images)

        const annotations = canvases.flatMap(({ canvas }) =>
            (canvas.annotations || []).flatMap(page =>
                (page.items || []).flatMap(annotation => buildImportedAnnotations(annotation, sourceByCanvas))))

        projectDB.add(
            projectID,
            {
                ...project,
                annotations
            })
            .then(() => {
                props.history.push(`/project/${projectID}/edit`)
            })
    } catch (err) {
        console.log(err)
        return Promise.reject(translation('errors.unable_access_file'))
    }
}

function buildImportedAnnotations(annotation, sourceByCanvas) {
    if (annotation.body) {
        return [{
            body: Array.isArray(annotation.body) ? annotation.body : [annotation.body],
            target: remapTargetSource(buildAnnotationTarget(annotation.target), sourceByCanvas),
            id: annotation.id,
            type: 'Annotation'
        }]
    }

    if (annotation.items) {
        return annotation.items.map(item => ({
            ...item,
            body: Array.isArray(item.body) ? item.body : [item.body],
            target: remapTargetSource(buildAnnotationTarget(item.target), sourceByCanvas)
        }))
    }

    return []
}

function canvasSize(painted, canvas) {
    const width = painted.width || canvas.width
    const height = painted.height || canvas.height

    return width && height ? { width, height } : {}
}

function canvasImage(canvas) {
    const painted = canvas.items?.[0]?.items?.[0]?.body

    if (!painted) {
        return null
    }

    const size = canvasSize(painted, canvas)
    const service = painted.service?.[0]?.id || painted.service?.[0]?.['@id']

    if (service) {
        return { source: service.endsWith('info.json') ? service : `${service}/info.json`, type: 'iiif', ...size }
    }

    return painted.id ? { source: painted.id, type: 'image', ...size } : null
}

function remapTargetSource(target, sourceByCanvas) {
    if (Array.isArray(target)) {
        return target.map(item => remapTargetSource(item, sourceByCanvas))
    }

    const mapped = target && target.source ? sourceByCanvas.get(target.source) : null

    return mapped ? { ...target, source: mapped } : target
}

function buildAnnotationTarget(target) {

    if (Array.isArray(target)) {
        return target.map(buildAnnotationTarget)
    }

    if (typeof target === 'string') {
        // "https://example.com/canvas-1#xywh=1415,406,334,626"
        const [source, fragment] = target.split('#')

        return {
            type: "SpecificResource",
            source,
            selector: {
                type: "FragmentSelector",
                value: fragment.replace('xywh=', 'xywh=pixel:'),
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
