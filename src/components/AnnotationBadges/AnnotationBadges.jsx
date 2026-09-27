import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleArrowDown, faCircleArrowLeft, faCircleArrowRight, faCircleArrowUp, faCirclePlay } from "@fortawesome/free-solid-svg-icons"

import { getAnnotationRotation } from "../../Utils/orientation"

import "./AnnotationBadges.css"

const QUARTER_ICONS = {
    90: faCircleArrowRight,
    180: faCircleArrowDown,
    270: faCircleArrowLeft
}

export function hasAudio(annotation) {
    if (Array.isArray(annotation.body) && annotation.body.length > 0) {
        const resource = annotation.body.find(body => body.type === "SpecificResource")

        return Boolean(resource?.source?.id)
    }

    return false
}

export function AnnotationBadges({ annotation, translate }) {
    const rotation = getAnnotationRotation(annotation)
    const turned = rotation !== null && rotation !== 0
    const sound = hasAudio(annotation)

    if (!turned && !sound) {
        return null
    }

    return (
        <div className="anno-card-badges">
            {turned &&
                <div className="tooltip tooltip-bottom z-50" data-tip={`${translate('annotation.orientation')} — ${rotation}°`}>
                    <span className="anno-badge anno-badge--orientation">
                        <FontAwesomeIcon icon={QUARTER_ICONS[rotation] || faCircleArrowUp}
                            style={QUARTER_ICONS[rotation] ? undefined : { transform: `rotate(${rotation}deg)` }} />
                    </span>
                </div>
            }

            {sound &&
                <div className="tooltip tooltip-bottom z-50" data-tip={translate('annotation.sound')}>
                    <span className="anno-badge anno-badge--sound">
                        <FontAwesomeIcon icon={faCirclePlay} />
                    </span>
                </div>
            }
        </div>
    )
}
