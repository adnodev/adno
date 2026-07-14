import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowUp } from "@fortawesome/free-solid-svg-icons"

import { getAnnotationRotation } from "../../Utils/orientation"

export function OrientationBadge({ annotation, translate }) {
    const rotation = getAnnotationRotation(annotation)

    if (rotation === null || rotation === 0) {
        return null
    }

    return (
        <div className="tooltip tooltip-bottom z-50" data-tip={`${translate('annotation.orientation')} — ${rotation}°`}>
            <div className="text-xs inline-flex items-center font-bold leading-sm px-2 py-1 bg-amber-200 text-amber-700 rounded-full">
                <FontAwesomeIcon icon={faArrowUp} style={{ transform: `rotate(${rotation}deg)` }} />
            </div>
        </div>
    )
}
