import { normalizeAngle } from "../../Utils/orientation"

export const SNAP_STEP = 15
export const FINE_STEP = 1

export const VERTICAL_ARROW_DIRECTIONS: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1
}

export const ARROW_DIRECTIONS: Record<string, number> = {
    ...VERTICAL_ARROW_DIRECTIONS,
    ArrowRight: 1,
    ArrowLeft: -1
}

export type Point = {
    x: number,
    y: number
}

export function pointerAngle(centerX: number, centerY: number, x: number, y: number): number {
    return normalizeAngle(Math.atan2(x - centerX, -(y - centerY)) * 180 / Math.PI)
}

export function snapAngle(degrees: number, step: number): number {
    return normalizeAngle(Math.round(degrees / step) * step)
}

export function stepAngle(degrees: number, delta: number): number {
    return normalizeAngle(Math.round(degrees) + delta)
}

export function pointOnCircle(degrees: number, center: number, radius: number): Point {
    const radians = degrees * Math.PI / 180

    return {
        x: center + radius * Math.sin(radians),
        y: center - radius * Math.cos(radians)
    }
}
