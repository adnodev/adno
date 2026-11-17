import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeProject } from '../../src/services/format'
import { getTargets } from '../../src/Utils/targets'

const TESTS_ROOT = join(import.meta.dirname, '..')
const XYWH = /xywh=(?:pixel:)?([^"\s]+)/
const INTEGER_XYWH = /^\d+,\d+,\d+,\d+$/
const GROUPED_TARGET_ID = /^g\d+@/

function fixtureFiles(dir) {
    return readdirSync(dir).flatMap(name => {
        const path = join(dir, name)

        if (statSync(path).isDirectory()) {
            return fixtureFiles(path)
        }

        return name.endsWith('.fixture.json') ? [path] : []
    })
}

function loadJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'))
}

function isStoredProject(json) {
    return Array.isArray(json.annotations)
}

function commentingBodies(annotation) {
    return annotation.body.filter(item => item.purpose === 'commenting')
}

const storedProjects = fixtureFiles(TESTS_ROOT)
    .map(path => [path.slice(TESTS_ROOT.length + 1), loadJson(path)])
    .filter(([, json]) => isStoredProject(json))

describe('normalizeProject on a legacy annotation', () => {
    const record = {
        id: 'legacy',
        annotations: [
            {
                id: '#zone',
                type: 'Annotation',
                body: [],
                target: {
                    source: 'http://localhost:1234/legacy.png',
                    selector: {
                        type: 'FragmentSelector',
                        conformsTo: 'http://www.w3.org/TR/media-frags/',
                        value: 'xywh=pixel:12.4,8.7,100.49,50.5'
                    }
                },
                adno: {
                    cutouts: {
                        g1: true
                    }
                }
            }
        ]
    }

    const { project } = normalizeProject(record)
    const [annotation] = project.annotations

    it('rounds the fragment to integers', () => {
        expect(annotation.target.selector.value).toBe('xywh=12,9,100,51')
    })

    it('moves the cutouts under the adno prefix', () => {
        expect(annotation['adno:cutouts']).toEqual({
            g1: true
        })
        expect(annotation.adno).toBeUndefined()
    })

    it('spreads the whole-annotation cutout flag over every group', () => {
        const { project: flagged } = normalizeProject({
            id: 'flagged',
            annotations: [
                {
                    id: '#flagged',
                    type: 'Annotation',
                    body: [],
                    target: [
                        {
                            id: 'g1@#flagged',
                            source: 'http://localhost:1234/legacy.png'
                        },
                        {
                            id: 'g2@#flagged',
                            source: 'http://localhost:1234/legacy.png'
                        }
                    ],
                    adno: {
                        cutout: true
                    }
                }
            ]
        })

        expect(flagged.annotations[0]['adno:cutouts']).toEqual({
            g1: true,
            g2: true
        })
        expect(flagged.annotations[0].adno).toBeUndefined()
    })
})

describe('normalizeProject on legacy rights', () => {
    it('reads a URL as the licence', () => {
        const { project } = normalizeProject({
            id: 'licence',
            rights: 'https://creativecommons.org/licenses/by/4.0/'
        })

        expect(project.licence).toBe('https://creativecommons.org/licenses/by/4.0/')
        expect(project.attribution).toBeUndefined()
        expect(project.rights).toBeUndefined()
    })

    it('reads free text as the attribution', () => {
        const { project } = normalizeProject({
            id: 'attribution',
            rights: 'Musée de la Ville'
        })

        expect(project.attribution).toBe('Musée de la Ville')
        expect(project.licence).toBeUndefined()
        expect(project.rights).toBeUndefined()
    })
})

describe.each(storedProjects)('normalizeProject on %s', (_, record) => {
    const { project } = normalizeProject(record)

    it('keeps a single html body per annotation', () => {
        for (const annotation of project.annotations) {
            const bodies = commentingBodies(annotation)

            expect(bodies).toHaveLength(1)
            expect(bodies[0].type).toBe('TextualBody')
            expect(bodies[0].format).toBe('text/html')
        }
    })

    it('keeps the markdown source on the annotation', () => {
        for (const annotation of project.annotations) {
            expect(typeof annotation['adno:sourceMarkdown']).toBe('string')
        }
    })

    it('prefixes every target id with its group', () => {
        for (const annotation of project.annotations) {
            for (const target of getTargets(annotation)) {
                expect(target.id).toMatch(GROUPED_TARGET_ID)
            }
        }
    })

    it('stores integer xywh fragments', () => {
        for (const annotation of project.annotations) {
            for (const target of getTargets(annotation)) {
                const fragment = XYWH.exec(target.selector?.value || '')

                if (fragment) {
                    expect(fragment[1]).toMatch(INTEGER_XYWH)
                }
            }
        }
    })

    it('is idempotent', () => {
        const again = normalizeProject(project)

        expect(again.changed).toBe(false)
        expect(again.project).toEqual(project)
    })
})
