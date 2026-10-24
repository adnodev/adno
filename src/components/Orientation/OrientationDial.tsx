import { useRef, type KeyboardEvent, type PointerEvent } from "react"

import { ARROW_DIRECTIONS, FINE_STEP, SNAP_STEP, pointOnCircle, pointerAngle, snapAngle, stepAngle, type Point } from "./dial"

const SIZE = 120
const CENTER = SIZE / 2
const TRACK_RADIUS = 46
const TICK_COUNT = 24
const TICK_STEP = 360 / TICK_COUNT
const MAJOR_TICK_EVERY = 6

type Props = {
    value: number,
    disabled: boolean,
    label: string,
    onPreview(degrees: number): void,
    onCommit(degrees: number): void
}

type Tick = {
    key: number,
    from: Point,
    to: Point,
    major: boolean
}

function buildTicks(): Tick[] {
    return Array.from({ length: TICK_COUNT }, (_, index) => {
        const degrees = index * TICK_STEP
        const major = index % MAJOR_TICK_EVERY === 0
        const innerRadius = major ? TRACK_RADIUS - 8 : TRACK_RADIUS - 4

        return {
            key: degrees,
            from: pointOnCircle(degrees, CENTER, innerRadius),
            to: pointOnCircle(degrees, CENTER, TRACK_RADIUS),
            major
        }
    })
}

const TICKS = buildTicks()

export function OrientationDial({ value, disabled, label, onPreview, onCommit }: Props) {
    const draggingRef = useRef(false)

    const handle = pointOnCircle(value, CENTER, TRACK_RADIUS)
    const dialClass = disabled ? 'orientation-dial orientation-dial--disabled' : 'orientation-dial'

    const angleUnderPointer = (event: PointerEvent<SVGSVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect()
        const rawDegrees = pointerAngle(box.left + box.width / 2, box.top + box.height / 2, event.clientX, event.clientY)

        return snapAngle(rawDegrees, event.shiftKey ? FINE_STEP : SNAP_STEP)
    }

    const startDrag = (event: PointerEvent<SVGSVGElement>) => {
        if (disabled) {
            return
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        draggingRef.current = true
        onPreview(angleUnderPointer(event))
    }

    const followDrag = (event: PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current) {
            return
        }

        onPreview(angleUnderPointer(event))
    }

    const endDrag = (event: PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current) {
            return
        }

        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
        onCommit(angleUnderPointer(event))
    }

    const nudgeWithArrowKeys = (event: KeyboardEvent<SVGSVGElement>) => {
        const direction = ARROW_DIRECTIONS[event.key]

        if (disabled || direction === undefined) {
            return
        }

        event.preventDefault()
        onCommit(stepAngle(value, direction * (event.shiftKey ? SNAP_STEP : FINE_STEP)))
    }

    return (
        <svg className={dialClass}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            onPointerDown={startDrag}
            onPointerMove={followDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={nudgeWithArrowKeys}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={359}
            aria-valuenow={value}
            aria-valuetext={`${value}°`}
            aria-disabled={disabled}>
            <circle className="orientation-dial-track" cx={CENTER} cy={CENTER} r={TRACK_RADIUS} />

            {TICKS.map(tick =>
                <line key={tick.key}
                    className={tick.major ? 'orientation-dial-tick orientation-dial-tick--major' : 'orientation-dial-tick'}
                    x1={tick.from.x}
                    y1={tick.from.y}
                    x2={tick.to.x}
                    y2={tick.to.y} />
            )}

            <line className="orientation-dial-needle" x1={CENTER} y1={CENTER} x2={handle.x} y2={handle.y} />
            <circle className="orientation-dial-handle" cx={handle.x} cy={handle.y} r={7} />
        </svg>
    )
}
