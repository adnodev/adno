// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, readProject, seedProject } = require('../helpers');

const fixture = require('./multiimage.fixture.json');
const legacyFixture = require('../orientation/orientation.fixture.json');

const RECTO = 0;
const VERSO = 1;

/**
 * @param {import('@playwright/test').Page} page
 * @param {any} project
 */
async function openEditor(page, project) {
    await seedProject(page, project);
    await page.goto(`${BASE_URL}/#/project/${project.id}/edit`);
    await page.waitForSelector('.a9s-annotation', { timeout: 30000 });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
function drawnIds(page) {
    return page.locator('.a9s-annotation').evaluateAll(
        nodes => nodes.map(node => node.getAttribute('data-id') || ''));
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id, legacyFixture.id]);
});

test.describe('Editing a project made of several images', () => {

    test('a single-image project is left exactly as it was', async ({ page }) => {
        await openEditor(page, legacyFixture);

        await expect(page.locator('.filmstrip')).toHaveCount(0);
        await expect(page.locator('.a9s-annotation')).toHaveCount(legacyFixture.annotations.length);
    });

    test('the filmstrip lists every image and counts its zones', async ({ page }) => {
        await openEditor(page, fixture);

        await expect(page.locator('.filmstrip-thumb')).toHaveCount(2);
        await expect(page.locator('.filmstrip-count')).toHaveText('1/2');
        await expect(page.locator('.filmstrip-thumb').nth(RECTO)).toHaveClass(/filmstrip-thumb--current/);
        await expect(page.locator('.filmstrip-badge')).toHaveText(['2', '2']);
    });

    test('only the zones of the current image are drawn', async ({ page }) => {
        await openEditor(page, fixture);

        expect((await drawnIds(page)).sort()).toEqual(['#zone-both', '#zone-recto']);

        await page.locator('[data-image-index="1"]').click();

        await expect(page.locator('.filmstrip-count')).toHaveText('2/2');
        expect((await drawnIds(page)).sort()).toEqual(['#zone-both#t:1', '#zone-verso']);
    });

    test('the arrow keys walk through the images', async ({ page }) => {
        await openEditor(page, fixture);

        await page.locator('.filmstrip').focus();

        await page.keyboard.press('ArrowRight');
        await expect(page.locator('.filmstrip-count')).toHaveText('2/2');

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('.filmstrip-count')).toHaveText('1/2');

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('.filmstrip-count')).toHaveText('1/2');
    });

    test('every annotation keeps a card, whichever image is shown', async ({ page }) => {
        await openEditor(page, fixture);

        await expect(page.locator('.anno-card')).toHaveCount(fixture.annotations.length);

        await page.locator('[data-image-index="1"]').click();

        await expect(page.locator('.anno-card')).toHaveCount(fixture.annotations.length);
    });

    test('moving a zone on the second image spares the one on the first', async ({ page }) => {
        await openEditor(page, fixture);
        await page.locator('[data-image-index="1"]').click();

        const shape = page.locator('.a9s-annotation[data-id="#zone-both#t:1"]');
        await expect(shape).toBeVisible();

        await shape.click();
        await page.waitForTimeout(1000);

        const box = await shape.boundingBox();
        if (!box) {
            throw new Error('the shape has no box to drag');
        }

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(500);

        const saved = await readProject(page, fixture.id);
        /** @type {any[]} */
        const savedAnnotations = saved.annotations;
        /** @type {any} */
        const original = fixture.annotations.find(anno => anno.id === '#zone-both');
        const moved = savedAnnotations.find(anno => anno.id === '#zone-both');

        expect(moved.target).toHaveLength(2);
        expect(moved.target[RECTO].source).toEqual(original.target[RECTO].source);
        expect(moved.target[RECTO].selector).toEqual(original.target[RECTO].selector);
        expect(moved.target[VERSO].source).toEqual(original.target[VERSO].source);
        expect(moved.target[VERSO].selector.value).not.toEqual(original.target[VERSO].selector.value);
    });
});
