const TAGGING = 'tagging'

export function buildTagsList(annotation) {
    const body = annotation && annotation.body
    const bodies = Array.isArray(body) ? body : [body].filter(Boolean)

    return bodies
        .filter(entry => entry.purpose === TAGGING || entry.motivation === TAGGING)
        .map(entry => ({ value: entry.value || entry.id, label: entry.value || entry.id }))
}
