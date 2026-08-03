// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, readProject, seedProject } = require('../helpers');

const fixture = require('./multitarget.fixture.json');

/**
 * @param {import('@playwright/test').Page} page
 */
async function openEditor(page) {
    await seedProject(page, fixture);
    await page.goto(`${BASE_URL}/#/project/${fixture.id}/edit`);
    await page.waitForSelector('.editor-viewer', { timeout: 30000 });
    await page.waitForTimeout(1500);
}

/**
 * Bring the whole image back into view. Creating a zone frames it, so without
 * this the next drag lands inside the previous zone rather than beside it.
 *
 * @param {import('@playwright/test').Page} page
 */
async function resetView(page) {
    await page.locator('#toolbar-osd [title="Go home"]').click();
    await page.waitForTimeout(1200);
}

/**
 * Drag a rectangle inside the viewer. Coordinates are relative to the viewer,
 * which shrinks once the annotation sidebar appears.
 *
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
 * @returns {Promise<string[]>}
 */
function drawnIds(page) {
    return page.locator('.a9s-annotation').evaluateAll(
        nodes => nodes.map(node => node.getAttribute('data-id') || ''));
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
function selectedIds(page) {
    return page.locator('.a9s-annotation.selected, .a9s-annotation.editable').evaluateAll(
        nodes => nodes.map(node => node.getAttribute('data-id') || ''));
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id]);
});

test.describe('Giving an annotation a second zone', () => {

    test('the zone you draw joins the annotation and stays the selected one', async ({ page }) => {
        await openEditor(page);

        await drawRect(page, 140, 120, 90, 70);

        await expect(page.locator('.anno-card')).toHaveCount(1);
        await expect(page.locator('.a9s-annotation')).toHaveCount(1);

        const [first] = await drawnIds(page);

        await page.locator('.anno-card button:has([data-icon="plus"])').click();
        await expect(page.locator('.pending-zone')).toBeVisible();

        await drawRect(page, 380, 240, 100, 80);

        await expect(page.locator('.pending-zone')).toHaveCount(0);
        await expect(page.locator('.anno-card')).toHaveCount(1);
        await expect(page.locator('.a9s-annotation')).toHaveCount(2);

        expect((await drawnIds(page)).sort()).toEqual([first, `${first}#t:1`].sort());
        expect(await selectedIds(page)).toEqual([`${first}#t:1`]);
    });

    test('both zones land on a single annotation on disk', async ({ page }) => {
        await openEditor(page);

        await drawRect(page, 140, 120, 90, 70);
        await page.locator('.anno-card button:has([data-icon="plus"])').click();
        await drawRect(page, 380, 240, 100, 80);

        const saved = await readProject(page, fixture.id);
        /** @type {any[]} */
        const annotations = saved.annotations;

        expect(annotations).toHaveLength(1);
        expect(annotations[0].target).toHaveLength(2);
    });
});
