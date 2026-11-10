import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { detectFormat, fromAny, normalizeProject, toIIIFManifest, toWADMCollection } from '../../src/services/format'
import { getTargets } from '../../src/Utils/targets'

const TESTS = join(import.meta.dirname, '..')
const BASE = 'https://adno.app'
const NAUTRE_IMAGE = 'https://free.iiifhosting.com/iiif/523508e08754ca091e306ac62637b75abd7d364771a1c780d761cb910f991612/info.json'

function load(...segments) {
    return JSON.parse(readFileSync(join(TESTS, ...segments), 'utf8'))
}

function groupIds(annotation) {
    return getTargets(annotation).map(target => target.id.split('@')[0])
}

const nautreManifest = load('fixtures', 'conformance', 'nautre_adno_iiif_V3.conforme.json')
const nautreCollection = load('fixtures', 'conformance', 'nautre_adno_wadm.conforme.json')
const legacyCollection = load('multitarget', 'adno-export.fixture.json')
const base64Manifest = load('assets', 'iiif_export.json')

describe('detectFormat', () => {
    it('names every input Adno can read', () => {
        expect(detectFormat(nautreManifest)).toBe('adno-manifest')
        expect(detectFormat(nautreCollection)).toBe('annotation-collection')
        expect(detectFormat(legacyCollection)).toBe('legacy-collection')
        expect(detectFormat(base64Manifest)).toBe('legacy-base64-manifest')
        expect(detectFormat({ '@context': 'http://iiif.io/api/image/3/context.json', id: 'https://example.org/iiif/img', type: 'ImageService3' })).toBe('image-info')
        expect(detectFormat({ '@context': 'http://iiif.io/api/presentation/2/context.json', '@id': 'https://example.org/m', '@type': 'sc:Manifest' })).toBe('iiif-v2')
        expect(detectFormat({ hello: 'world' })).toBe('unknown')
    })
})

describe('fromAny on a third-party IIIF Manifest', () => {
    const project = fromAny(nautreManifest, { id: 'nautre' })

    it('reads the descriptive properties', () => {
        expect(project.id).toBe('nautre')
        expect(project.title).toBe('Nautré restauré')
        expect(project.description).toBe('Détail')
        expect(project.creator).toBe('Auteur de test')
        expect(project.editor).toBe('Éditeur de test')
        expect(project.licence).toBe('https://creativecommons.org/licenses/by-sa/4.0/')
    })

    it('turns the Canvas into an image and the zones back onto it', () => {
        expect(project.images).toEqual([
            {
                id: 'https://example.com/canvas-1',
                source: NAUTRE_IMAGE,
                type: 'iiif',
                label: 'Détail du Nautré pour illustrer l\'avant et l\'après de la restauration',
                width: 12500,
                height: 6000
            }
        ])
        expect(project.annotations).toHaveLength(4)

        for (const annotation of project.annotations) {
            for (const target of getTargets(annotation)) {
                expect(target.source).toBe(NAUTRE_IMAGE)
            }
        }
    })

    it('maps the lettered groups onto Adno group ids', () => {
        expect(groupIds(project.annotations[0])).toEqual(['g1'])
        expect(groupIds(project.annotations[1])).toEqual(['g1', 'g2'])
    })

    it('keeps the html body and the markdown source', () => {
        const [first] = project.annotations

        expect(first.body).toHaveLength(1)
        expect(first.body[0].format).toBe('text/html')
        expect(first['adno:sourceMarkdown']).toBe('Détail du Nautré pour illustrer l\'avant et l\'après de la restauration')
    })
})

describe('fromAny on a third-party Web Annotation collection', () => {
    const project = fromAny(nautreCollection, { id: 'nautre-wadm' })

    it('reads the collection and deduces the image from the zones', () => {
        expect(project.title).toBe('Nautré restauré')
        expect(project.annotations).toHaveLength(4)
        const targetSource = nautreCollection.first.items[0].target.source

        expect(project.images).toEqual([
            {
                id: targetSource,
                source: targetSource,
                label: '',
                type: 'iiif'
            }
        ])
        expect(getTargets(project.annotations[0])[0].source).toBe(targetSource)
        expect(groupIds(project.annotations[1])).toEqual(['g1', 'g2'])
    })
})

describe('fromAny on a legacy Adno collection', () => {
    const project = fromAny(legacyCollection, { id: 'legacy' })

    it('reads the flat legacy fields', () => {
        expect(project.title).toBe('Round trip multi zone')
        expect(project.creation_date).toBe('2026-07-01T00:00:00.000Z')
        expect(project.settings.showNavigator).toBe(false)
        expect(project.images).toEqual([
            {
                id: 'http://localhost:1234/round-trip-source.png',
                source: 'http://localhost:1234/round-trip-source.png',
                label: '',
                type: 'image'
            }
        ])
        expect(project.annotations).toHaveLength(1)
        expect(getTargets(project.annotations[0])).toHaveLength(2)
    })
})

describe('fromAny on a legacy Base64 Manifest', () => {
    const project = fromAny(base64Manifest, { id: 'base64' })

    it('decodes the settings and reads the metadata dump', () => {
        expect(project.title).toBe('second')
        expect(project.description).toBe('une super desc')
        expect(project.settings.delay).toBeTypeOf('number')
        expect(project.images).toHaveLength(1)
        expect(project.images[0].type).toBe('iiif')
        expect(project.images[0].width).toBe(2406)
        expect(project.annotations).toHaveLength(5)
        expect(getTargets(project.annotations[0])[0].source).toBe(project.images[0].source)
    })
})

describe('fromAny round trips', () => {
    const record = load('multiimage', 'multiimage.fixture.json')
    const { project } = normalizeProject({
        ...record,
        creator: 'Jane Doe',
        editor: 'The Lab',
        licence: 'https://creativecommons.org/licenses/by/4.0/',
        attribution: 'Musée de la Ville',
        images: record.images.map(image => ({ ...image, width: 400, height: 300 }))
    })

    function comparable({ licence, last_update, annotations, ...rest }) {
        return {
            ...rest,
            annotations: [...annotations].sort((a, b) => a.id.localeCompare(b.id))
        }
    }

    it('reads its own Manifest back', () => {
        const back = fromAny(toIIIFManifest(project, { base: BASE }), { id: project.id })

        expect(back.licence).toBe('http://creativecommons.org/licenses/by/4.0/')
        expect(comparable(back)).toEqual(comparable(project))
    })

    it('reads its own collection back', () => {
        const back = fromAny(toWADMCollection(project, { base: BASE }), { id: project.id })

        expect(comparable(back)).toEqual(comparable(project))
    })
})
