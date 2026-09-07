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

export function ContentMargin({ annotation, project, position, offsetTop, canStart, onStart, translate }) {
    const html = htmlBody(annotation)
    const tags = buildTagsList(annotation)
    const track = audioSource(annotation)

    const anchored = position === 'left' || position === 'right'

    if (!annotation) {
        return (
            <div id="adno-content-margin"
                className={`content-margin content-margin--${position}`}
                style={anchored ? { top: `${offsetTop}px` } : null}>
                <h2 className="content-margin-title">{project && project.title}</h2>

                {project && project.description &&
                    <p className="content-margin-intro">{project.description}</p>
                }

                {canStart &&
                    <button type="button" className="btn btn-outline content-margin-start" onClick={onStart}>
                        {translate('visualizer.start_tour')}
                    </button>
                }
            </div>
        )
    }

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
