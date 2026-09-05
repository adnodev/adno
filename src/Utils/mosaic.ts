import { normalizeAngle } from "./orientation"
import type { MosaicRatio, MosaicRotation } from "./project"

const QUARTER_TURN = 90
const NAMES = ['a', 'b', 'c', 'd']
const LARGEST = 4

type MosaicShape = {
    areas: string[],
    '1/2': [string, string],
    '2/3': [string, string]
}

export type MosaicLayout = {
    columns: string,
    rows: string,
    areas: string,
    names: string[]
}

const MOSAICS: Record<number, MosaicShape[]> = {
    1: [
        { areas: ['a'], '1/2': ['1fr', '1fr'], '2/3': ['1fr', '1fr'] }
    ],
    2: [
        { areas: ['a b'], '1/2': ['1fr 1fr', '1fr'], '2/3': ['2fr 1fr', '1fr'] },
        { areas: ['a', 'b'], '1/2': ['1fr', '1fr 1fr'], '2/3': ['1fr', '2fr 1fr'] },
        { areas: ['b a'], '1/2': ['1fr 1fr', '1fr'], '2/3': ['1fr 2fr', '1fr'] },
        { areas: ['b', 'a'], '1/2': ['1fr', '1fr 1fr'], '2/3': ['1fr', '1fr 2fr'] }
    ],
    3: [
        { areas: ['a b', 'a c'], '1/2': ['1fr 1fr', '1fr 1fr'], '2/3': ['2fr 1fr', '2fr 1fr'] },
        { areas: ['a a', 'c b'], '1/2': ['1fr 1fr', '1fr 1fr'], '2/3': ['1fr 2fr', '2fr 1fr'] },
        { areas: ['c a', 'b a'], '1/2': ['1fr 1fr', '1fr 1fr'], '2/3': ['1fr 2fr', '1fr 2fr'] },
        { areas: ['b c', 'a a'], '1/2': ['1fr 1fr', '1fr 1fr'], '2/3': ['2fr 1fr', '1fr 2fr'] }
    ],
    4: [
        { areas: ['a b b', 'a d c'], '1/2': ['2fr 1fr 1fr', '1fr 1fr'], '2/3': ['6fr 1fr 2fr', '2fr 1fr'] },
        { areas: ['a a', 'd b', 'c b'], '1/2': ['1fr 1fr', '2fr 1fr 1fr'], '2/3': ['1fr 2fr', '6fr 1fr 2fr'] },
        { areas: ['c d a', 'b b a'], '1/2': ['1fr 1fr 2fr', '1fr 1fr'], '2/3': ['2fr 1fr 6fr', '1fr 2fr'] },
        { areas: ['b c', 'b d', 'a a'], '1/2': ['1fr 1fr', '1fr 1fr 2fr'], '2/3': ['2fr 1fr', '2fr 1fr 6fr'] }
    ]
}

export function mosaicCount(groups: number): number {
    return Math.min(Math.max(groups, 1), LARGEST)
}

export function mosaicLayout(groups: number, rotation: MosaicRotation = 0, ratio: MosaicRatio = '1/2'): MosaicLayout {
    const count = mosaicCount(groups)
    const shapes = MOSAICS[count]
    const shape = shapes[Math.round(normalizeAngle(rotation) / QUARTER_TURN) % shapes.length]
    const [columns, rows] = shape[ratio] || shape['1/2']

    return {
        columns,
        rows,
        areas: shape.areas.map(row => `"${row}"`).join(' '),
        names: NAMES.slice(0, count)
    }
}
