import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeProject } from '../../src/services/format'
import { getTargets } from '../../src/Utils/targets'

const LEGACY_BODY_TYPES = ['HTMLBody', 'AdnoRichText']
const INTEGER_FRAGMENT = /^xywh=\d+,\d+,\d+,\d+$/
const GROUPED_TARGET_ID = /^g\d+@/

const dump = JSON.parse(readFileSync(join(import.meta.dirname, 'legacy-db-before-normalize.json'), 'utf8'))
const records = dump.ProjectsDB.projects

function bodies(annotation) {
    return Array.isArray(annotation.body) ? annotation.body : []
}

function commentingBodies(annotation) {
    return bodies(annotation).filter(item => item.purpose === 'commenting')
}

function lastLegacyHtml(annotation) {
    const htmls = bodies(annotation).filter(item => item.type === 'HTMLBody')

    return htmls.length > 0 ? htmls[htmls.length - 1].value : null
}

function withoutLegacy(annotation) {
    return bodies(annotation).filter(item => item.purpose !== 'commenting' && !LEGACY_BODY_TYPES.includes(item.type))
}

describe.each(records.map(record => [record.title, record]))('legacy IndexedDB record "%s"', (_, record) => {
    const { project } = normalizeProject(record)
    const before = record.annotations || []
    const after = project.annotations

    it('keeps every annotation and every target', () => {
        expect(after).toHaveLength(before.length)

        before.forEach((annotation, index) => {
            expect(getTargets(after[index])).toHaveLength(getTargets(annotation).length)
        })
    })

    it('leaves no legacy body type behind', () => {
        for (const annotation of after) {
            for (const body of bodies(annotation)) {
                expect(LEGACY_BODY_TYPES).not.toContain(body.type)
            }
        }
    })

    it('keeps one html comment per annotated text', () => {
        before.forEach((annotation, index) => {
            const comments = commentingBodies(after[index])
            const hadText = commentingBodies(annotation).some(item => item.value)

            if (!hadText) {
                expect(comments).toHaveLength(0)
                return
            }

            expect(comments).toHaveLength(1)
            expect(comments[0].type).toBe('TextualBody')
            expect(comments[0].format).toBe('text/html')
            expect(typeof after[index]['adno:sourceMarkdown']).toBe('string')
        })
    })

    it('keeps the latest html when a record carries two', () => {
        before.forEach((annotation, index) => {
            const htmls = bodies(annotation).filter(item => item.type === 'HTMLBody')

            if (htmls.length === 2) {
                expect(commentingBodies(after[index])[0].value).toBe(lastLegacyHtml(annotation))
            }
        })
    })

    it('keeps tags and audio untouched', () => {
        before.forEach((annotation, index) => {
            expect(bodies(after[index]).filter(item => item.purpose !== 'commenting')).toEqual(withoutLegacy(annotation))
        })
    })

    it('prefixes target ids and rounds fragments', () => {
        for (const annotation of after) {
            for (const target of getTargets(annotation)) {
                expect(target.id).toMatch(GROUPED_TARGET_ID)

                if (target.selector && target.selector.value.startsWith('xywh=')) {
                    expect(target.selector.value).toMatch(INTEGER_FRAGMENT)
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
