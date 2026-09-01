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

/**
 * Open the annotation panel through its edit button and switch to the Zones
 * tab, which is the second of the four tabs in the strip.
 *
 * @param {import('@playwright/test').Page} page
 */
async function openPanel(page) {
    await page.locator('.anno-card button:has([data-icon="pen-to-square"])').click();
    await expect(page.locator('.rich-card-editor')).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function openZonesTab(page) {
    await openPanel(page);
    await page.locator('.rich-card-tab').nth(1).click();
    await expect(page.locator('.zone-groups')).toBeVisible();
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

test.describe('The grouped zones tab', () => {

    test('each group gets its own card, letter and chips', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await expect(page.locator('.zone-group')).toHaveCount(2);
        await expect(page.locator('.zone-group-badge')).toHaveText(['A', 'B']);
        await expect(page.locator('.zone-group').first()).toHaveAttribute('data-group-id', 'g1');
        await expect(page.locator('.zone-group').nth(0).locator('.zone-row[data-zone-index]')).toHaveCount(1);
        await expect(page.locator('.zone-group').nth(1).locator('.zone-row[data-zone-index]')).toHaveCount(1);
    });

    test('an orientation set on one group leaves the other alone', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await page.locator('.zone-group').nth(0).locator('.zone-group-rotation').selectOption('90');
        await page.waitForTimeout(800);

        const targets = await savedTargets(page);

        expect(targets[0].selector.refinedBy).toEqual({ type: 'ImageApiSelector', rotation: '90' });
        expect(targets[1].selector.refinedBy).toEqual({ type: 'ImageApiSelector', rotation: '180' });
    });

    test('the cutout flag is stored under the group it belongs to', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await page.locator('.zone-group').nth(0).locator('.zone-group-cutout input').click();
        await page.waitForTimeout(800);

        const saved = await readProject(page, PROJECT_ID);

        expect(saved.annotations[0].adno.cutouts).toEqual({ g1: true });
    });

    test('a group added from the panel stays out of the stored annotation', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await page.locator('.zone-group-add').click();

        await expect(page.locator('.zone-group')).toHaveCount(3);
        await expect(page.locator('.zone-group-badge')).toHaveText(['A', 'B', 'C']);

        const targets = await savedTargets(page);

        expect(targets).toHaveLength(2);
    });
});

test.describe('Drawing into a group from the panel', () => {

    test('a zone drawn for group A joins it even though it lands last in the array', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await page.locator('.zone-group').nth(0).locator('.zone-row--add').click();
        await expect(page.locator('.pending-zone')).toBeVisible();

        await drawRect(page, 520, 120, 90, 70);

        const targets = await savedTargets(page);

        expect(targets.map(target => target.id)).toEqual([
            `g1@${ANNOTATION_ID}`,
            `g2@${ANNOTATION_ID}`,
            `g1@${ANNOTATION_ID}`
        ]);
    });

    test('every zone of the current annotation is stroked with its group colour', async ({ page }) => {
        await openEditor(page);

        await page.locator('.anno-card').first().click();
        await page.waitForTimeout(1200);

        const strokes = await page.locator('#openseadragon1 .a9s-annotation').evaluateAll(
            nodes => nodes.map((node) => {
                const inner = node.getElementsByClassName('a9s-inner')[0];
                return inner ? inner.style.stroke : '';
            }));

        expect(strokes.sort()).toEqual(['rgb(196, 98, 42)', 'rgb(36, 81, 196)']);
    });
});

test.describe('The edit view stays whole', () => {

    test('selecting a two-group annotation keeps a single viewer', async ({ page }) => {
        await openEditor(page);

        await page.locator('.anno-card').first().click();
        await page.waitForTimeout(1200);

        await expect(page.locator('.group-panel')).toHaveCount(0);
        await expect(page.locator('.editor-group-badge')).toContainText('A');
    });
});

test.describe('Drawing while the panel is open', () => {

    test('a drawn zone joins the active group instead of spawning an annotation', async ({ page }) => {
        await openEditor(page);
        await openPanel(page);

        await drawRect(page, 420, 120, 90, 70);

        const targets = await savedTargets(page);

        expect(targets.map(target => target.id)).toEqual([
            `g1@${ANNOTATION_ID}`,
            `g2@${ANNOTATION_ID}`,
            `g1@${ANNOTATION_ID}`
        ]);
        await expect(page.locator('.rich-card-editor')).toBeVisible();
    });
});

test.describe('The save guard', () => {

    test('closing a dirty panel asks and saving writes the changes', async ({ page }) => {
        await openEditor(page);
        await openPanel(page);

        await page.locator('.rich-card-tab').nth(3).click();
        await page.locator('#track').fill('https://example.org/reading.mp3');

        await page.locator('.rich-card-close').click();
        await expect(page.locator('.swal2-popup')).toBeVisible();

        await page.locator('.swal2-confirm').click();
        await page.waitForTimeout(800);

        await expect(page.locator('.rich-card-editor')).toHaveCount(0);

        const saved = await readProject(page, PROJECT_ID);
        const audio = saved.annotations[0].body.find((/** @type {any} */ body) => body.type === 'SpecificResource');

        expect(audio.source.id).toEqual('https://example.org/reading.mp3');
    });

    test('a pristine panel closes without asking', async ({ page }) => {
        await openEditor(page);
        await openPanel(page);

        await page.locator('.rich-card-close').click();

        await expect(page.locator('.swal2-popup')).toHaveCount(0);
        await expect(page.locator('.rich-card-editor')).toHaveCount(0);
    });
});

/**
 * Drive an HTML5 drag with a real DataTransfer. A simulated mouse never fires
 * dragstart/drop in Chromium, so the events are dispatched directly; the
 * handlers only read event.target and the transfer, so this exercises them
 * for real.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} from
 * @param {string} to
 */
async function dragOnto(page, from, to) {
    await page.evaluate(([fromSelector, toSelector]) => {
        const source = document.querySelector(fromSelector);
        const target = document.querySelector(toSelector);

        if (!source || !target) {
            throw new Error(`missing drag endpoint: ${fromSelector} -> ${toSelector}`);
        }

        const dataTransfer = new DataTransfer();
        const fire = (node, type) => node.dispatchEvent(
            new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));

        fire(source, 'dragstart');
        fire(target, 'dragover');
        fire(target, 'drop');
    }, [from, to]);

    await page.waitForTimeout(800);
}

test.describe('Dragging zones and groups', () => {

    test('a chip dropped on another group changes group without moving in the array', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        const before = await savedTargets(page);

        await dragOnto(page, '.zone-row[data-zone-index="1"]', '.zone-group[data-group-id="g1"]');

        const after = await savedTargets(page);

        expect(after.map(item => item.id)).toEqual([`g1@${ANNOTATION_ID}`, `g1@${ANNOTATION_ID}`]);
        expect(after.map(item => item.selector.value)).toEqual(before.map(item => item.selector.value));
        await expect(page.locator('.zone-group')).toHaveCount(1);
    });

    test('groups offer no reorder handle any more', async ({ page }) => {
        await openEditor(page);
        await openZonesTab(page);

        await expect(page.locator('[data-group-grip]')).toHaveCount(0);
        await expect(page.locator('.zone-group').first()).toHaveAttribute('data-group-id', 'g1');
    });
});
