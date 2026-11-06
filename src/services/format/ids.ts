export function projectRoot(base: string, projectId: string): string {
    return `${base}/projects/${projectId}`
}

export function manifestId(root: string): string {
    return `${root}/manifest.json`
}

export function canvasId(root: string, index: number): string {
    return `${root}/canvas/${index + 1}`
}

export function paintingPageId(root: string, index: number): string {
    return `${canvasId(root, index)}/painting`
}

export function annotationPageId(root: string, index: number): string {
    return `${canvasId(root, index)}/annotations`
}

export function collectionId(root: string): string {
    return `${root}/collection.json`
}

export function collectionPageId(root: string): string {
    return `${root}/collection/page/1`
}

export function annotationId(root: string, internalId: string): string {
    return `${root}/annotations/${internalId.replace(/^#/, '')}`
}

export function zoneId(root: string, internalId: string, groupId: string, index: number): string {
    return `${annotationId(root, internalId)}#${groupId}-${index + 1}`
}
