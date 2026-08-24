import parse from "html-react-parser"

import { buildTagsList } from "../../Utils/utils"

function annotationBody(annotation) {
    return Array.isArray(annotation && annotation.body) ? annotation.body : []
}

function htmlBody(annotation) {
    const html = annotationBody(annotation).find(item => item.type === "HTMLBody")

    return html && html.value ? html.value : null
}

function audioSource(annotation) {
    const track = annotationBody(annotation).find(item => item.type === "SpecificResource")

    return track && track.source ? track.source.id : null
}

export function hasMarginContent(annotation) {
    if (!annotation) {
        return false
    }

    return Boolean(htmlBody(annotation)) || Boolean(audioSource(annotation)) || buildTagsList(annotation).length > 0
}

export function ContentMargin({ annotation, position, offsetTop }) {
    const html = htmlBody(annotation)
    const tags = buildTagsList(annotation)
    const track = audioSource(annotation)

    const anchored = position === 'left' || position === 'right'

    return (
        <div id="adno-content-margin"
            className={`content-margin content-margin--${position}`}
            style={anchored ? { top: `${offsetTop}px` } : null}>
            {html && <div className="content-margin-body markdown-body">{parse(html)}</div>}

            {tags.length > 0 &&
                <div className="content-margin-tags">
                    {tags.map((tag, index) =>
                        <span key={`${tag.value}-${index}`} className="content-margin-tag">{tag.value}</span>
                    )}
                </div>
            }

            {track && <audio className="content-margin-audio" controls src={track}></audio>}
        </div>
    )
}
