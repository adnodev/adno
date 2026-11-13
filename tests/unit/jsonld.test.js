import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import jsonld from 'jsonld'
import { normalizeProject, toIIIFManifest, toWADMCollection } from '../../src/services/format'

const ROOT = join(import.meta.dirname, '..', '..')
const ADNO_NS = 'https://adno.app/ns#'
const ADNO_CONTEXT_URL = 'https://w.adno.app/ns/context.json'

const CONTEXTS = join(ROOT, 'tests', 'fixtures', 'contexts')

function vendoredContext(url) {
    if (url === ADNO_CONTEXT_URL) {
        return join(ROOT, 'public', 'ns', 'context.json')
    }

    return join(CONTEXTS, url.replace(/^https?:\/\//, '').replace(/[^A-Za-z0-9.]+/g, '-'))
}

async function offlineLoader(url) {
    return {
        contextUrl: null,
        document: JSON.parse(readFileSync(vendoredContext(url), 'utf8')),
        documentUrl: url
    }
}

function expand(document) {
    return jsonld.expand(document, { documentLoader: offlineLoader })
}

function occurrences(text, needle) {
    return text.split(needle).length - 1
}

const record = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'multiimage', 'multiimage.fixture.json'), 'utf8'))
const { project } = normalizeProject(record)

const withCutout = {
    ...project,
    images: project.images.map(image => ({ ...image, width: 400, height: 300 })),
    annotations: project.annotations.map((annotation, index) => index === 0
        ? { ...annotation, 'adno:cutouts': { g1: true } }
        : annotation)
}

describe('JSON-LD expansion of the exports', () => {
    for (const [name, document] of [
        ['IIIF Manifest', toIIIFManifest(withCutout, { base: 'https://adno.app' })],
        ['Web Annotation collection', toWADMCollection(withCutout, { base: 'https://adno.app' })]
    ]) {
        it(`resolves every adno: key of the ${name} to an IRI`, async () => {
            const expanded = JSON.stringify(await expand(document))
            const compact = JSON.stringify(document)

            expect(expanded).toContain(`"${ADNO_NS}project":[{"@type":"@json"`)
            expect(occurrences(expanded, `"${ADNO_NS}sourceMarkdown"`)).toBe(occurrences(compact, '"adno:sourceMarkdown"'))
            expect(expanded).toContain(`"${ADNO_NS}cutouts":[{"@type":"@json"`)
        })
    }
})
