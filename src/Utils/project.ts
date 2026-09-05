import type { Annotation } from "./targets"
import type { ProjectImage } from "./images"

export const CONTENT_POSITIONS = ['floating', 'left', 'bottom', 'right'] as const

export type ContentPosition = typeof CONTENT_POSITIONS[number]

export const MULTIVIEW_LAYOUTS = ['row', 'column'] as const

export type MultiviewLayout = typeof MULTIVIEW_LAYOUTS[number]

export const MOSAIC_RATIOS = ['1/2', '2/3'] as const

export type MosaicRatio = typeof MOSAIC_RATIOS[number]

export const MOSAIC_ROTATIONS = [0, 90, 180, 270] as const

export type MosaicRotation = typeof MOSAIC_ROTATIONS[number]

export type SoundMode = 'no_sound' | 'no_spatialization' | 'spatialization'

export type RotationTransition = 'turn' | 'instant'

export type ProjectSettings = {
    delay: number,
    showNavigator: boolean,
    toolsbarOnFs: boolean,
    sidebarEnabled: boolean,
    startbyfirstanno: boolean,
    shouldAutoPlayAnnotations: boolean,
    rotation: boolean,
    defaultRotation: number,
    rotationTransition: RotationTransition,
    displayToolbar: boolean,
    tags: string[],
    outlineWidth: string,
    outlineColor: string,
    outlineColorFocus: string,
    showOutlines: boolean,
    showEyes: boolean,
    soundMode: SoundMode,
    showCurrentAnnotation: boolean,
    contentPosition: ContentPosition,
    mosaicRatio: MosaicRatio,
    mosaicRotation: MosaicRotation,
    groupColorA: string,
    groupColorB: string,
    groupColorC: string,
    groupColorD: string
}

export type Project = {
    id: string,
    title: string,
    description: string,
    creation_date: string,
    last_update: string,
    editor: string,
    creator: string,
    img_url?: string,
    manifest_url?: string,
    images?: ProjectImage[],
    settings?: Partial<ProjectSettings>,
    annotations?: Annotation[]
}

export function defaultProjectSettings(): ProjectSettings {
    return {
        delay: 5,
        showNavigator: true,
        toolsbarOnFs: true,
        sidebarEnabled: true,
        startbyfirstanno: false,
        shouldAutoPlayAnnotations: false,
        rotation: false,
        defaultRotation: 0,
        rotationTransition: "turn",
        displayToolbar: true,
        tags: [],
        outlineWidth: "outline-1px",
        outlineColor: "outline-white",
        outlineColorFocus: "outline-focus-yellow",
        showOutlines: true,
        showEyes: false,
        soundMode: 'no_sound',
        showCurrentAnnotation: false,
        contentPosition: 'left',
        mosaicRatio: '1/2',
        mosaicRotation: 0,
        groupColorA: '#2451C4',
        groupColorB: '#C4622A',
        groupColorC: '#1F9E6D',
        groupColorD: '#A23DBB'
    }
}
