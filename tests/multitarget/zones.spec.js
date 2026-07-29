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
    await page.locator('#toolbar-container .a9s-toolbar-btn.rect').click();

    const viewer = await page.locator('.editor-viewer').boundingBox();

    if (!viewer) {
        throw new Error('no viewer to draw on');
    }

    await page.mouse.move(viewer.x + x, viewer.y + y);
    await page.mouse.down();
    await page.mouse.move(viewer.x + x + width, viewer.y + y + height, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(800);
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

/**
 * Wait for the viewer to stop moving: selecting a zone reframes the view, and a
 * click landing mid-animation misses its target.
 *
 * @param {import('@playwright/test').Page} page
 */
async function settle(page) {
    const shape = page.locator('.a9s-annotation').first();
    let previous = null;
    let box = await shape.boundingBox();

    while (!previous || !box || previous.x !== box.x || previous.y !== box.y) {
        previous = box;
        await page.waitForTimeout(400);
        box = await shape.boundingBox();
    }
}

/**
 * Drag the first resize handle of the shape currently being edited.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} dx
 * @param {number} dy
 */
async function dragHandle(page, dx, dy) {
    const handle = await page.locator('.a9s-annotation.editable .a9s-handle').first().boundingBox();

    if (!handle) {
        throw new Error('no handle to drag');
    }

    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 * @returns {Promise<string>}
 */
function shapeGeometry(page, id) {
    return page.locator(`.a9s-annotation[data-id="${id}"]:not(.editable) rect`).first().evaluate(node => [
        node.getAttribute('x'),
        node.getAttribute('y'),
        node.getAttribute('width'),
        node.getAttribute('height')
    ].join(' '));
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

    test('each zone can be picked again afterwards', async ({ page }) => {
        await openEditor(page);

        await drawRect(page, 140, 120, 90, 70);
        await page.locator('.anno-card button:has([data-icon="plus"])').click();
        await drawRect(page, 380, 240, 100, 80);

        const ids = await drawnIds(page);
        const first = ids.find(id => !id.includes('#t:')) || '';
        const second = `${first}#t:1`;

        await settle(page);
        await page.locator(`.a9s-annotation[data-id="${first}"]`).click();
        await settle(page);
        expect(await selectedIds(page)).toEqual([first]);

        await page.locator(`.a9s-annotation[data-id="${second}"]`).click();
        await settle(page);
        expect(await selectedIds(page)).toEqual([second]);
    });
});

test.describe('Reshaping a zone then clicking another one', () => {

    test('the old outline never comes back on screen', async ({ page }) => {
        await openEditor(page);

        await drawRect(page, 140, 120, 90, 70);
        await drawRect(page, 380, 240, 100, 80);

        const ids = Array.from(new Set(await drawnIds(page)));
        expect(ids).toHaveLength(2);

        const [first, second] = ids;

        await settle(page);

        const before = await shapeGeometry(page, first);

        await page.locator(`.a9s-annotation[data-id="${first}"]`).click();
        await settle(page);

        await dragHandle(page, 45, 35);
        await expect(page.locator('.move-btn')).toBeVisible();

        await page.evaluate(([id]) => {
            const w = /** @type {any} */ (window);
            w.__frames = [];
            const tick = () => {
                const rect = document.querySelector(`.a9s-annotation[data-id="${id}"]:not(.editable) rect`);
                if (rect) {
                    w.__frames.push([
                        rect.getAttribute('x'),
                        rect.getAttribute('y'),
                        rect.getAttribute('width'),
                        rect.getAttribute('height')
                    ].join(' '));
                }
                w.__raf = requestAnimationFrame(tick);
            };
            tick();
        }, [first]);

        await page.locator(`.a9s-annotation[data-id="${second}"]`).click();
        await page.waitForTimeout(800);

        /** @type {string[]} */
        const frames = await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            cancelAnimationFrame(w.__raf);
            return w.__frames;
        });

        expect(frames.length).toBeGreaterThan(0);
        expect(frames).not.toContain(before);
        expect(await selectedIds(page)).toEqual([second]);
    });
});
