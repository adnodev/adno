// @ts-check

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
    return page.locator('.anno-card').nth(index).click();
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
        await expect(page.locator('.cutout-body canvas')).toBeVisible();

        expect(await rotationOf(page)).toBe(0);
    });

    test('the cutout draws the annotation outline, and only that one', async ({ page }) => {
        await openViewer(page);

        await focus(page, CUTOUT);

        await expect(page.locator('.cutout-body .a9s-annotation')).toHaveCount(1);
        await expect(page.locator('.openseadragon-canvas .a9s-annotation')).not.toHaveCount(1);
    });

    test('only annotations carrying an angle get a badge', async ({ page }) => {
        await openViewer(page);

        await expect(page.locator('.anno-card').nth(UPRIGHT).locator('.anno-badge')).toHaveCount(0);
        await expect(page.locator('.anno-card').nth(UPSIDE_DOWN).locator('[data-icon="circle-arrow-down"]')).toHaveCount(1);
    });
});

test.describe('The cutout panel', () => {

    test('minimising it keeps it one tap away, even across annotations', async ({ page }) => {
        await openViewer(page);

        await focus(page, CUTOUT);
        await expect(page.locator('.cutout-panel')).toBeVisible({ timeout: 10000 });

        await page.locator('.cutout-btn--minimize').click();
        await expect(page.locator('.cutout-pill')).toBeVisible();
        await expect(page.locator('.cutout-panel')).toBeHidden();

        await focus(page, UPRIGHT);
        await expect(page.locator('.cutout-pill')).toHaveCount(0);

        await focus(page, CUTOUT);
        await expect(page.locator('.cutout-pill')).toBeVisible();

        await page.locator('.cutout-pill').click();
        await expect(page.locator('.cutout-panel')).toBeVisible();
        await expect(page.locator('.cutout-body canvas')).toBeVisible();
    });

    test('it is dropped as soon as the reading leaves the cutouts', async ({ page }) => {
        await openViewer(page);

        await focus(page, CUTOUT);
        await expect(page.locator('.cutout-body')).toHaveCount(1);

        await focus(page, INHERITS);
        await expect(page.locator('.cutout-body')).toHaveCount(0);
    });
});

/**
 * Whether the cutout panel lives inside the element the browser took
 * fullscreen. A panel left outside still has a layout box — it just never gets
 * painted — so a visibility assertion would pass either way. Containment is
 * the claim that matters.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
function cutoutInsideFullscreen(page) {
    return page.evaluate(() => {
        const panel = document.querySelector('.cutout-panel');

        return Boolean(document.fullscreenElement && panel && document.fullscreenElement.contains(panel));
    });
}

/**
 * How far the annotation shape sits from the centre of the viewer, as a
 * fraction of the viewer's own size. Resizing costs the framing, not the
 * angle, so the framing is what has to be watched across a fullscreen switch.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} annoId
 * @returns {Promise<{dx: number, dy: number}|null>}
 */
function offsetFromCentre(page, annoId) {
    return page.evaluate((id) => {
        const shape = document.querySelector(`.openseadragon-canvas .a9s-annotation[data-id="${id}"]`);
        const viewer = document.getElementById('adno-osd');

        if (!shape || !viewer) {
            return null;
        }

        const box = shape.getBoundingClientRect();
        const frame = viewer.getBoundingClientRect();

        return {
            dx: Math.abs((box.left + box.width / 2) - (frame.left + frame.width / 2)) / frame.width,
            dy: Math.abs((box.top + box.height / 2) - (frame.top + frame.height / 2)) / frame.height
        };
    }, annoId);
}

test.describe('Reading orientation in fullscreen', () => {

    test.skip(({ browserName }) => browserName !== 'chromium', 'Fullscreen is only driven on Chromium.');

    test('the cutout panel follows the viewer into fullscreen', async ({ page }) => {
        await openViewer(page);

        await focus(page, CUTOUT);
        await expect(page.locator('.cutout-panel')).toBeVisible({ timeout: 10000 });

        await page.locator('#toggle-fullscreen').click();

        await expect.poll(() => cutoutInsideFullscreen(page), { timeout: 5000 }).toBe(true);
    });

    test('a turned annotation stays framed across a fullscreen switch', async ({ page }) => {
        await openViewer(page);

        await focus(page, UPSIDE_DOWN);
        await expect.poll(() => rotationOf(page), { timeout: 10000 }).toBe(180);

        await page.locator('#toggle-fullscreen').click();

        await expect.poll(() => rotationOf(page), { timeout: 5000 }).toBe(180);
        await expect.poll(() => offsetFromCentre(page, '#ori-upside-down'), { timeout: 5000 })
            .toEqual({ dx: expect.closeTo(0, 1), dy: expect.closeTo(0, 1) });
    });
});
