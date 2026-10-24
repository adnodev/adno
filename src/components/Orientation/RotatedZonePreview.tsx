import type { Target } from "../../Utils/targets"
import { ZonePreview } from "../AdnoMarkdown/ZonePreview"

type Props = {
    target: Target | null,
    degrees: number
}

export function RotatedZonePreview({ target, degrees }: Props) {
    if (!target) {
        return null
    }

    return (
        <div className="orientation-preview" style={{ transform: `rotate(${degrees}deg)` }}>
            <ZonePreview target={target} />
        </div>
    )
}
