import { targetBox, targetShape } from "../../Utils/targets"

const SIZE = 44
const MARGIN = 0.12

function drawShape(shape) {
    if (shape.kind === "rect") {
        return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} />
    }

    if (shape.kind === "circle") {
        return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
    }

    if (shape.kind === "ellipse") {
        return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />
    }

    if (shape.kind === "polygon") {
        return <polygon points={shape.points} />
    }

    return <path d={shape.d} />
}

export function ZonePreview({ target }) {
    const shape = targetShape(target)
    const box = shape ? targetBox(target) : null

    if (!box || !box.width || !box.height) {
        return <span className="zone-preview zone-preview--empty" />
    }

    const margin = Math.max(box.width, box.height) * MARGIN
    const viewBox = [box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2].join(" ")

    return (
        <svg className="zone-preview"
            width={SIZE}
            height={SIZE}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet">
            {drawShape(shape)}
        </svg>
    )
}
