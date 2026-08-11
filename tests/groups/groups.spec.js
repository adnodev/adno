// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, readProject, seedProject } = require('../helpers');

const canvas = require('../multitarget/multitarget.fixture.json');

const PROJECT_ID = 'groups-test-project';
const ANNOTATION_ID = '#legacy-two-zones';

const fixture = {
    ...canvas,
    id: PROJECT_ID,
    title: 'Groups',
    description: 'A legacy annotation whose zones predate group ids',
    annotations: [{
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id: ANNOTATION_ID,
        type: 'Annotation',
        body: [
            { type: 'TextualBody', value: 'LEGACY', purpose: 'commenting' },
            { type: 'HTMLBody', value: '<p>LEGACY</p>', purpose: 'commenting' }
        ],
        target: [
            {
                source: canvas.img_url,
                selector: {
                    type: 'FragmentSelector',
                    conformsTo: 'http://www.w3.org/TR/media-frags/',
                    value: 'xywh=pixel:40,40,120,90'
                }
            },
            {
                id: `g2@${ANNOTATION_ID}`,
                source: canvas.img_url,
                selector: {
                    type: 'FragmentSelector',
                    conformsTo: 'http://www.w3.org/TR/media-frags/',
                    value: 'xywh=pixel:260,200,140,100',
                    refinedBy: { type: 'ImageApiSelector', rotation: '180' }
                }
            }
        ]
    }]
};

/**
 * @param {import('@playwright/test').Page} page
 */
async function openEditor(page) {
    await seedProject(page, fixture);
    await page.goto(`${BASE_URL}/#/project/${PROJECT_ID}/edit`);
    await page.waitForSelector('.editor-viewer', { timeout: 30000 });
    await page.waitForTimeout(1500);
}

/**
 * Bring the whole image back into view, so the next drag lands beside the
 * existing zones rather than inside them.
 *
 * @param {import('@playwright/test').Page} page
 */
async function resetView(page) {
    await page.locator('#toolbar-osd [title="Go home"]').click();
    await page.waitForTimeout(1200);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
async function drawRect(page, x, y, width, height) {
    await resetView(page);
    await page.locator('#toolbar-container .a9s-toolbar-btn.rect').click();

    const viewer = await page.locator('.editor-viewer').boundingBox();

    if (!viewer) {
        throw new Error('no viewer to draw on');
    }

    await page.mouse.move(viewer.x + x, viewer.y + y);
    await page.mouse.down();
    await page.mouse.move(viewer.x + x + width, viewer.y + y + height, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<any[]>}
 */
async function savedTargets(page) {
    const saved = await readProject(page, PROJECT_ID);

    expect(saved.annotations).toHaveLength(1);

    return saved.annotations[0].target;
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [PROJECT_ID]);
});

test.describe('Group ids across an edit round-trip', () => {

    test('a zone that predates groups is stamped once something gets written', async ({ page }) => {
        await openEditor(page);

        await page.locator('.anno-card button:has([data-icon="plus"])').click();
        await drawRect(page, 420, 120, 90, 70);

        const targets = await savedTargets(page);

        expect(targets).toHaveLength(3);
        expect(targets.map(target => target.id)).toEqual([
            `g1@${ANNOTATION_ID}`,
            `g2@${ANNOTATION_ID}`,
            `g2@${ANNOTATION_ID}`
        ]);
    });

    test('the rotation of a group survives a new zone joining it', async ({ page }) => {
        await openEditor(page);

        await page.locator('.anno-card button:has([data-icon="plus"])').click();
        await drawRect(page, 420, 120, 90, 70);

        const targets = await savedTargets(page);

        expect(targets[1].selector.refinedBy).toEqual({ type: 'ImageApiSelector', rotation: '180' });
        expect(targets[0].selector.refinedBy).toBeUndefined();
    });
});
