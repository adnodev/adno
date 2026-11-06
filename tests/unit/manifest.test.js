import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeProject, toIIIFManifest } from '../../src/services/format'

const BASE = 'https://adno.app'
const ADNO_CONTEXT = 'https://adno.app/ns/context.json'
const IIIF_CONTEXT = 'http://iiif.io/api/presentation/3/context.json'
const FIXTURES = join(import.meta.dirname, '..', 'fixtures')
const VALIDATED = join(FIXTURES, 'iiif-validate', 'generated-manifest.json')

const embedded = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'multiimage', 'multiimage.fixture.json'), 'utf8'))

function withHttpSources(project) {
    const json = project.images.reduce(
        (text, image, index) => text.replaceAll(image.source, `https://example.org/folio-${index + 1}.png`),
        JSON.stringify(project))

    return JSON.parse(json)
}

const record = withHttpSources(embedded)

function withSizes(project) {
    return {
        ...project,
        images: project.images.map((image, index) => ({
            ...image,
            width: 400 + index,
            height: 300
        }))
    }
}

const { project } = normalizeProject(withSizes(record))
const root = `${BASE}/projects/${project.id}`
const manifest = toIIIFManifest(project, { base: BASE })
const [recto, verso] = manifest.items

describe('toIIIFManifest', () => {
    it('declares the Adno context before the IIIF one', () => {
        expect(manifest['@context']).toEqual([ADNO_CONTEXT, IIIF_CONTEXT])
    })

    it('identifies the Manifest under the base', () => {
        expect(manifest.id).toBe(`${root}/manifest.json`)
        expect(manifest.type).toBe('Manifest')
    })

    it('maps the title and the description to label and summary', () => {
        expect(manifest.label).toEqual({
            none: ['Two folios']
        })
        expect(manifest.summary).toEqual({
            none: ['Zones spread over two images']
        })
        expect(manifest.metadata).toBeUndefined()
        expect(manifest.provider).toBeUndefined()
        expect(manifest.rights).toBeUndefined()
        expect(manifest.requiredStatement).toBeUndefined()
    })

    it('maps the people and the rights to IIIF properties', () => {
        const described = toIIIFManifest({
            ...project,
            creator: 'Jane Doe',
            editor: 'The Lab',
            licence: 'https://creativecommons.org/licenses/by/4.0/',
            attribution: 'Musée de la Ville'
        }, { base: BASE })

        expect(described.metadata).toEqual([
            {
                label: {
                    none: ['Auteur']
                },
                value: {
                    none: ['Jane Doe']
                }
            }
        ])
        expect(described.provider).toEqual([
            {
                id: `${root}/manifest.json#editor`,
                type: 'Agent',
                label: {
                    none: ['The Lab']
                }
            }
        ])
        expect(described.rights).toBe('http://creativecommons.org/licenses/by/4.0/')
        expect(described.requiredStatement).toEqual({
            label: {
                none: ['Attribution']
            },
            value: {
                none: ['Musée de la Ville']
            }
        })
    })

    it('keeps a licence outside the IIIF vocabularies out of rights', () => {
        const custom = toIIIFManifest({
            ...project,
            licence: 'https://example.org/licence',
            attribution: 'Musée de la Ville'
        }, { base: BASE })

        expect(custom.rights).toBeUndefined()
        expect(custom.requiredStatement.value).toEqual({
            none: ['Musée de la Ville — https://example.org/licence']
        })
    })

    it('paints one Canvas per image', () => {
        expect(manifest.items).toHaveLength(2)
        expect(recto.id).toBe(`${root}/canvas/1`)
        expect(verso.id).toBe(`${root}/canvas/2`)
        expect(recto.type).toBe('Canvas')
        expect(recto.label).toEqual({
            none: ['Folio 1r']
        })
        expect(recto.width).toBe(400)
        expect(recto.height).toBe(300)

        const [page] = recto.items
        const [painting] = page.items

        expect(page.id).toBe(`${root}/canvas/1/painting`)
        expect(painting.motivation).toBe('painting')
        expect(painting.body.id).toBe(project.images[0].source)
        expect(painting.body.type).toBe('Image')
        expect(painting.body.format).toBe('image/png')
        expect(painting.body.width).toBe(400)
        expect(painting.target).toBe(recto.id)
    })

    it('files each annotation on the Canvas of its first zone', () => {
        const [rectoPage] = recto.annotations
        const [versoPage] = verso.annotations

        expect(rectoPage.id).toBe(`${root}/canvas/1/annotations`)
        expect(rectoPage.items.map(item => item.id)).toEqual([
            `${root}/annotations/zone-recto`,
            `${root}/annotations/zone-both`
        ])
        expect(versoPage.items.map(item => item.id)).toEqual([
            `${root}/annotations/zone-verso`
        ])
    })

    it('writes a single html body and keeps the markdown source', () => {
        const [annotation] = recto.annotations[0].items

        expect(annotation.motivation).toBe('commenting')
        expect(annotation.body).toEqual({
            type: 'TextualBody',
            value: '<p>RECTO ONLY</p>',
            format: 'text/html',
            purpose: 'commenting'
        })
        expect(annotation['adno:sourceMarkdown']).toBe('RECTO ONLY')
    })

    it('points the zones at their Canvas and keeps their group ids', () => {
        const [single, split] = recto.annotations[0].items

        expect(single.target).toEqual({
            type: 'SpecificResource',
            id: `${root}/annotations/zone-recto#g1-1`,
            source: recto.id,
            selector: {
                type: 'FragmentSelector',
                conformsTo: 'http://www.w3.org/TR/media-frags/',
                value: 'xywh=pixel:10,10,80,60'
            }
        })
        expect(split.target.map(target => target.source)).toEqual([recto.id, verso.id])
        expect(split.target.map(target => target.id)).toEqual([
            `${root}/annotations/zone-both#g1-1`,
            `${root}/annotations/zone-both#g1-2`
        ])
    })

    it('keeps the Adno data under adno:project', () => {
        expect(manifest['adno:project']).toEqual({
            id: project.id,
            created: project.creation_date,
            modified: project.last_update,
            generator: {
                id: 'https://adno.app',
                type: 'Software',
                name: 'Adno'
            },
            settings: project.settings,
            images: project.images
        })
    })

    it('writes the Manifest validated by the CI', () => {
        mkdirSync(join(FIXTURES, 'iiif-validate'), { recursive: true })
        writeFileSync(VALIDATED, `${JSON.stringify(manifest, null, 2)}\n`)

        expect(JSON.parse(readFileSync(VALIDATED, 'utf8')).id).toBe(manifest.id)
    })
})
