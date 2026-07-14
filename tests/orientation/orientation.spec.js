// @ts-check
//
// Per-annotation reading orientation.
//
// The Exultet roll case: text and illuminations are head-to-tail on the same
// support, so an annotation must be able to carry the angle it should be read
// at. Two presentations are possible, and an annotation picks one:
//
//   - turn   -> the viewport rotates to the annotation's angle,
//   - cutout -> the viewport stays put and the region is shown upright aside.
//
// Everything here runs offline: the fixture embeds its image as a data URI, so
// no IIIF server is involved (the IIIF cutout URL path is unit-covered by the
// selector itself; here the CSS fallback is what gets exercised).

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');

const fixture = require('./orientation.fixture.json');

const UPRIGHT = 0;
const UPSIDE_DOWN = 1;
const INHERITS = 2;
const CUTOUT = 3;

/**
 * The viewport rotation, read off the Annotorious layer transform — the only
 * place OpenSeadragon's angle surfaces in the DOM. Normalised, because the
 * viewer always turns the short way round and therefore accumulates: coming
 * back to 0 from 180 lands on 360, which is the same thing on screen.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number|null>}
 */
function rotationOf(page) {
    return page.evaluate(() => {
        const layer = document.querySelector('svg.a9s-annotationlayer g');
        const transform = layer ? layer.getAttribute('transform') || '' : '';
        const found = /rotate\(([-\d.]+)/.exec(transform);
        return found ? ((Math.round(parseFloat(found[1])) % 360) + 360) % 360 : null;
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} index
 */
function focus(page, index) {
    return page.locator('.anno-card').nth(index).locator('[data-icon="bullseye"]').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function openViewer(page) {
    await seedProject(page, fixture);
    await page.goto(`${BASE_URL}/#/project/${fixture.id}/view`);
    await page.waitForSelector('.a9s-annotation', { timeout: 30000 });
    await expect(page.locator('.anno-card')).toHaveCount(fixture.annotations.length);
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id]);
});

test.describe('Reading orientation', () => {

    test('the viewport turns to the angle the annotation carries', async ({ page }) => {
        await openViewer(page);

        await focus(page, UPRIGHT);
        await expect.poll(() => rotationOf(page)).toBe(0);

        await focus(page, UPSIDE_DOWN);
        await expect.poll(() => rotationOf(page), { timeout: 10000 }).toBe(180);
    });

    test('an annotation with no angle falls back to the project default', async ({ page }) => {
        await openViewer(page);

        await focus(page, UPSIDE_DOWN);
        await expect.poll(() => rotationOf(page), { timeout: 10000 }).toBe(180);

        await focus(page, INHERITS);
        await expect.poll(() => rotationOf(page), { timeout: 10000 }).toBe(0);
    });

    test('the pan finishes before the turn starts', async ({ page }) => {
        await openViewer(page);

        await focus(page, UPRIGHT);
        await expect.poll(() => rotationOf(page)).toBe(0);

        // This is the whole anti-Prezi claim: rotation and translation are never
        // composed. Sample while the viewer is moving — the angle must not have
        // budged yet.
        await focus(page, UPSIDE_DOWN);

        for (let tick = 0; tick < 5; tick++) {
            expect(await rotationOf(page)).toBe(0);
            await page.waitForTimeout(100);
        }

        await expect.poll(() => rotationOf(page), { timeout: 10000 }).toBe(180);
    });

    test('a cutout annotation is shown aside, and the image stays put', async ({ page }) => {
        await openViewer(page);

        await focus(page, CUTOUT);

        await expect(page.locator('.cutout-panel')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.cutout-panel img')).toBeVisible();

        // It carries an angle, but a cutout must not rotate the viewport: that
        // is the point of showing it aside rather than turning the whole image.
        expect(await rotationOf(page)).toBe(0);

        await page.locator('.cutout-close').click();
        await expect(page.locator('.cutout-panel')).toHaveCount(0);
    });

    test('only annotations carrying an angle get a badge', async ({ page }) => {
        await openViewer(page);

        await expect(page.locator('.anno-card').nth(UPRIGHT).locator('[data-icon="arrow-up"]')).toHaveCount(0);
        await expect(page.locator('.anno-card').nth(UPSIDE_DOWN).locator('[data-icon="arrow-up"]')).toHaveCount(1);
    });
});
