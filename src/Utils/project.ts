import type { Annotation } from "./targets"
import type { ProjectImage } from "./images"

export type ContentPosition = 'floating' | 'left' | 'bottom' | 'right'

export type MultiviewLayout = 'row' | 'column'

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
    multiviewDisposition: MultiviewLayout,
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
