// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, readProject, seedProject } = require('../helpers');

const base = require('./multitarget.fixture.json');

/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function zone(x, y, width, height) {
    return {
        source: base.img_url,
        selector: {
            type: 'FragmentSelector',
            conformsTo: 'http://www.w3.org/TR/media-frags/',
            value: `xywh=pixel:${x},${y},${width},${height}`
        }
    };
}

const polygon = {
    source: base.img_url,
    selector: {
        type: 'SvgSelector',
        value: '<svg><polygon points="80,250 210,240 220,350 90,360"></polygon></svg>'
    }
};

const fixture = {
    ...base,
    id: 'isolation-fixture',
    annotations: [{
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id: '#dual',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'dual', purpose: 'commenting' }],
        target: [
            { id: 'g1@#dual', ...zone(40, 40, 160, 120) },
            { id: 'g1@#dual', ...zone(340, 200, 160, 120) },
            { id: 'g1@#dual', ...polygon }
        ]
    }, {
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id: '#neighbour',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'neighbour', purpose: 'commenting' }],
        target: { id: 'g1@#neighbour', ...zone(360, 220, 60, 40) }
    }]
};

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
 * @param {import('@playwright/test').Page} page
 */
function editableId(page) {
    return page.locator('.a9s-annotation.editable').evaluateAll(
        nodes => nodes.map(node => node.getAttribute('data-id') || /** @type {any} */ (node).annotation?.id || null)[0] ?? null);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
async function centerOf(page, id) {
    const box = await page.locator(`.a9s-annotation[data-id="${id}"]`).first().boundingBox();

    if (!box) {
        throw new Error(`no box for ${id}`);
    }

    return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id]);
});

test.describe('Editing an annotation with several zones', () => {

    test('selecting it greys the others out and frames its workspace', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.a9s-annotation[data-id="#neighbour"]')).toHaveClass(/a9s-muted/);
        await expect(page.locator('.workspace-frame')).toHaveCount(1);
    });

    test('clicking its second zone takes the focus even over a smaller neighbour', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        const { box } = await centerOf(page, '#dual#t:1');
        await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2);
        await page.waitForTimeout(1000);

        expect(await editableId(page)).toEqual('#dual#t:1');
        await expect(page.locator('.a9s-annotation[data-id="#dual#t:1"]')).toHaveCount(1);
    });

    test('clicking its polygon zone selects it', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        const { x, y } = await centerOf(page, '#dual#t:2');
        await page.mouse.click(x, y);
        await page.waitForTimeout(1000);

        expect(await editableId(page)).toEqual('#dual#t:2');

        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y + 30, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const saved = await readProject(page, fixture.id);
        const moved = saved.annotations[0].target[2].selector.value;
        expect(moved).not.toEqual(polygon.selector.value);

        expect(await editableId(page)).toEqual('#dual#t:2');

        const frame = await page.locator('.workspace-frame').boundingBox();
        const shape = await page.locator('.a9s-annotation.editable').boundingBox();

        if (!frame || !shape) {
            throw new Error('frame or polygon missing');
        }

        const margin = 40;
        expect(shape.x).toBeGreaterThanOrEqual(frame.x - margin);
        expect(shape.y).toBeGreaterThanOrEqual(frame.y - margin);
        expect(shape.x + shape.width).toBeLessThanOrEqual(frame.x + frame.width + margin);
        expect(shape.y + shape.height).toBeLessThanOrEqual(frame.y + frame.height + margin);

        const anchor = await centerOf(page, '#dual');
        await page.mouse.move(x + 40, y + 30);
        await page.mouse.down();
        await page.mouse.move(x + 80, y + 60, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const again = await readProject(page, fixture.id);
        expect(again.annotations[0].target[2].selector.value).not.toEqual(moved);
        expect((await centerOf(page, '#dual')).x).toEqual(anchor.x);
        expect(await editableId(page)).toEqual('#dual#t:2');
    });

    test('dragging a rectangle zone after closing the panel is saved', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        await page.locator('[id="anno_edit_card_#dual"] button:has([data-icon="pen-to-square"])').click();
        await expect(page.locator('.rich-card-editor')).toBeVisible();
        await page.locator('.rich-card-close').click();
        await expect(page.locator('.rich-card-editor')).toHaveCount(0);
        await page.waitForTimeout(1000);

        const { x, y, box } = await centerOf(page, '#dual#t:1');
        await page.mouse.click(box.x + box.width * 0.9, box.y + box.height * 0.9);
        await page.waitForTimeout(1000);

        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y + 30, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const saved = await readProject(page, fixture.id);
        expect(saved.annotations[0].target[1].selector.value).not.toEqual('xywh=pixel:340,200,160,120');
    });

    test('clicking its polygon zone after closing the panel selects it', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        await page.locator('[id="anno_edit_card_#dual"] button:has([data-icon="pen-to-square"])').click();
        await expect(page.locator('.rich-card-editor')).toBeVisible();
        await page.locator('.rich-card-close').click();
        await expect(page.locator('.rich-card-editor')).toHaveCount(0);
        await page.waitForTimeout(1000);

        const { x, y } = await centerOf(page, '#dual#t:2');
        await page.mouse.click(x, y);
        await page.waitForTimeout(1000);

        expect(await editableId(page)).toEqual('#dual#t:2');
        await expect(page.locator('.a9s-annotation.editable')).not.toHaveClass(/a9s-muted/);

        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y + 30, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(800);

        const saved = await readProject(page, fixture.id);
        const points = saved.annotations[0].target[2].selector.value;
        expect(points).not.toEqual(polygon.selector.value);
    });

    test('clicking between its zones keeps the selection', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        const first = await centerOf(page, '#dual');
        const second = await centerOf(page, '#dual#t:1');
        await page.mouse.click((first.x + second.x) / 2, (first.y + second.y) / 2);
        await page.waitForTimeout(1000);

        expect(await editableId(page)).toEqual('#dual');
        await expect(page.locator('.workspace-frame')).toHaveCount(1);
    });

    test('clicking far outside its workspace leaves the mode', async ({ page }) => {
        await openEditor(page);
        await page.locator('.a9s-annotation[data-id="#dual"]').click();
        await page.waitForTimeout(1000);

        const viewer = await page.locator('#openseadragon1').boundingBox();

        if (!viewer) {
            throw new Error('no viewer');
        }

        await page.mouse.click(viewer.x + viewer.width - 15, viewer.y + viewer.height - 15);
        await page.waitForTimeout(1000);

        await expect(page.locator('.a9s-annotation.editable')).toHaveCount(0);
        await expect(page.locator('.workspace-frame')).toHaveCount(0);
        await expect(page.locator('.a9s-annotation[data-id="#neighbour"]')).not.toHaveClass(/a9s-muted/);
    });
});
