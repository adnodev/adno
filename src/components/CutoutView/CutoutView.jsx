import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

import { resolveCutout } from "../../Utils/cutout"
import { getAnnotationRotation } from "../../Utils/orientation"

import "./CutoutView.css"

const MAX_SIZE = 720

export function CutoutView({ project, annotation, close, translate }) {
    const cutout = resolveCutout(project, annotation, MAX_SIZE)

    if (!cutout) {
        return null
    }

    const rotation = getAnnotationRotation(annotation)

    return (
        <div className="cutout-panel">
            <button type="button"
                className="btn btn-square btn-sm cutout-close"
                aria-label={translate('annotation.cutout_close')}
                onClick={() => close()}>
                <FontAwesomeIcon icon={faXmark} />
            </button>

            {cutout.styles
                ? <div style={cutout.styles.frame}>
                    <img src={cutout.src} alt="" style={cutout.styles.image} />
                </div>
                : <img src={cutout.src} alt="" className="cutout-image" />}

            {rotation ? <div className="cutout-caption">{translate('annotation.cutout_rotated', { degrees: rotation })}</div> : null}
        </div>
    )
}
