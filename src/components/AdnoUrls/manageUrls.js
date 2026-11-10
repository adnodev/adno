import { enhancedFetch } from "../../Utils/utils";
import { projectDB } from "../../services/db";
import { fromAny, isAdnoExport } from "../../services/format";
import { toast } from "../Toast/store"
import { v7 } from 'uuid'

function isJsonContentType(contentType) {
    const jsonPattern = /^(application\/(vnd\.api\+json|ld\+json|x-json-stream|json)(;.*)?|text\/json)$/i;
    return jsonPattern.test(contentType.trim()) || contentType === 'application/octet-stream';
}

function looksLikeIIIF(document) {
    const hasContext = document.hasOwnProperty("@context") || document.hasOwnProperty("context")
    const hasId = document.hasOwnProperty("@id") || document.hasOwnProperty("id")

    return hasContext && hasId
}

function openAsNewProject(props, url) {
    localStorage.setItem("adno_image_url", url)
    localStorage.removeItem("selected_canva")
    props.history.push("/new")
}

function rejectNotIIIF(props, translation) {
    toast.error(translation('errors.no_iiif'))
    props.history.push("/")
}

function importProject(props, project, translation) {
    return projectDB.add(project.id, project)
        .then(() => {
            toast.success(translation('import.import_success'))
            props.history.push(`/project/${project.id}/edit`)
        })
}

function readDocument(props, document, url, translation) {
    const project = fromAny(document, { id: v7() })

    if (project && (isAdnoExport(document) || project.annotations.length > 0)) {
        return importProject(props, project, translation)
    }

    if (project || looksLikeIIIF(document)) {
        return openAsNewProject(props, url)
    }

    return rejectNotIIIF(props, translation)
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
        return enhancedFetch(step === "decoreURIComponent" ? decodeURIComponent(url) : url)
            .then(rawReponse => {
                if (rawReponse.response.ok) {
                    const { response } = rawReponse
                    const contentType = response.headers.get('Content-Type')

                    if (isJsonContentType(contentType)) {
                        response.text()
                            .then(data => readDocument(props, JSON.parse(data), rawReponse.url, translation))
                            .catch(_err => {
                                if (step === "decoreURIComponent") {
                                    return manageUrls(props, url, translation, "rawURL")
                                }
                            })
                    } else {
                        openAsNewProject(props, rawReponse.url)
                    }
                } else {
                    return Promise.reject(translation('errors.unable_access_file'))
                }
            })
    } else {
        return Promise.reject(`${translation('errors.wrong_url')}: ${url}`)
    }
}
