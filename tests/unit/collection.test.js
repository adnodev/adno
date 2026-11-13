import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeProject, toWADMCollection } from '../../src/services/format'

const BASE = 'https://adno.app'
const ADNO_CONTEXT = 'https://w.adno.app/ns/context.json'
const ANNO_CONTEXT = 'http://www.w3.org/ns/anno.jsonld'

const record = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'multiimage', 'multiimage.fixture.json'), 'utf8'))
const { project } = normalizeProject(record)
const root = `${BASE}/projects/${project.id}`
const collection = toWADMCollection({ ...project, creator: 'Jane Doe' }, { base: BASE })

describe('toWADMCollection', () => {
    it('declares the Adno context before the Web Annotation one', () => {
        expect(collection['@context']).toEqual([ADNO_CONTEXT, ANNO_CONTEXT])
    })

    it('describes the collection with Web Annotation terms', () => {
        expect(collection.id).toBe(`${root}/collection.json`)
        expect(collection.type).toBe('AnnotationCollection')
        expect(collection.label).toBe('Two folios')
        expect(collection.creator).toEqual({
            type: 'Person',
            name: 'Jane Doe'
        })
        expect(collection.created).toBe(project.creation_date)
        expect(collection.modified).toBe(project.last_update)
        expect(collection.generator).toEqual({
            id: 'https://adno.app',
            type: 'Software',
            name: 'Adno'
        })
        expect(collection.total).toBe(3)
    })

    it('lists every annotation on the first page, zones left on their image', () => {
        const page = collection.first

        expect(page.id).toBe(`${root}/collection/page/1`)
        expect(page.type).toBe('AnnotationPage')
        expect(page.startIndex).toBe(0)
        expect(page.items.map(item => item.id)).toEqual([
            `${root}/annotations/zone-recto`,
            `${root}/annotations/zone-verso`,
            `${root}/annotations/zone-both`
        ])

        const [recto] = page.items

        expect(recto.motivation).toBe('commenting')
        expect(recto.body.format).toBe('text/html')
        expect(recto['adno:sourceMarkdown']).toBe('RECTO ONLY')
        expect(recto.target).toEqual(project.annotations[0].target)
    })

    it('keeps what Web Annotation cannot say under adno:project', () => {
        expect(collection['adno:project']).toEqual({
            id: project.id,
            settings: project.settings,
            images: project.images,
            description: 'Zones spread over two images'
        })
    })
})
