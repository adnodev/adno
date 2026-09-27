// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, expandSidebar, seedProject } = require('../helpers');

const canvas = require('../multitarget/multitarget.fixture.json');

const PROJECT_ID = 'reader-mosaic-project';
const ANNOTATION_ID = '#mosaic-groups';
const TOLERANCE = 6;

/**
 * @param {string} group
 * @param {string} fragment
 */
function target(group, fragment) {
    return {
        id: `${group}@${ANNOTATION_ID}`,
        source: canvas.img_url,
        selector: {
            type: 'FragmentSelector',
            conformsTo: 'http://www.w3.org/TR/media-frags/',
            value: `xywh=pixel:${fragment}`
        }
    };
}

const ZONES = [
    target('g1', '40,40,120,90'),
    target('g2', '260,200,140,100'),
    target('g3', '420,60,90,70')
];

/**
 * @param {any} settings
 * @param {number=} groups
 */
function projectWith(settings, groups) {
    return {
        ...canvas,
        id: PROJECT_ID,
        title: 'Reader mosaic',
        description: 'One annotation spread over several zone groups',
        settings: { ...canvas.settings, ...settings },
        annotations: [{
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            id: ANNOTATION_ID,
            type: 'Annotation',
            body: [
                { type: 'TextualBody', value: 'MOSAIC', purpose: 'commenting' },
                { type: 'HTMLBody', value: '<p>MOSAIC</p>', purpose: 'commenting' }
            ],
            target: ZONES.slice(0, groups || ZONES.length)
        }]
    };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {any} project
 */
async function openViewer(page, project) {
    await seedProject(page, project);
    await page.goto(`${BASE_URL}/#/project/${PROJECT_ID}/view`);
    await page.waitForSelector('.a9s-annotation', { timeout: 30000 });
    await expandSidebar(page);
    await page.locator('.anno-card').first().click();
    await page.waitForTimeout(1500);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function scene(page) {
    const mosaic = await page.locator('.adno-mosaic').boundingBox();
    const viewer = await page.locator('#adno-osd-viewer').boundingBox();

    if (!mosaic || !viewer) {
        throw new Error('the mosaic scene was not rendered');
    }

    return { mosaic, viewer };
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [PROJECT_ID]);
});

test.describe('Reading scene laid out as a spiral mosaic', () => {

    test('the active group takes the left half at ratio 1/2', async ({ page }) => {
        await openViewer(page, projectWith({ mosaicRatio: '1/2', mosaicRotation: 0 }));

        const { mosaic, viewer } = await scene(page);

        expect(Math.abs(viewer.width - mosaic.width / 2)).toBeLessThan(TOLERANCE);
        expect(Math.abs(viewer.height - mosaic.height)).toBeLessThan(TOLERANCE);

        await expect(page.locator('.group-panel')).toHaveCount(2);

        const panels = await page.locator('.group-panel').evaluateAll(
            nodes => nodes.map(node => node.getBoundingClientRect().top));

        expect(panels[0]).not.toEqual(panels[1]);
    });

    test('the active group widens to two thirds at ratio 2/3', async ({ page }) => {
        await openViewer(page, projectWith({ mosaicRatio: '2/3', mosaicRotation: 0 }));

        const { mosaic, viewer } = await scene(page);

        expect(Math.abs(viewer.width - mosaic.width * 2 / 3)).toBeLessThan(TOLERANCE);
        expect(Math.abs(viewer.height - mosaic.height)).toBeLessThan(TOLERANCE);
    });

    test('a quarter turn moves the active group to the top row', async ({ page }) => {
        await openViewer(page, projectWith({ mosaicRatio: '1/2', mosaicRotation: 90 }));

        const { mosaic, viewer } = await scene(page);

        expect(Math.abs(viewer.width - mosaic.width)).toBeLessThan(TOLERANCE);
        expect(Math.abs(viewer.height - mosaic.height / 2)).toBeLessThan(TOLERANCE);
        expect(Math.abs(viewer.y - mosaic.y)).toBeLessThan(TOLERANCE);
    });

    test('a single group fills the whole scene', async ({ page }) => {
        await openViewer(page, projectWith({ mosaicRatio: '1/2', mosaicRotation: 0 }, 1));

        const { mosaic, viewer } = await scene(page);

        expect(Math.abs(viewer.width - mosaic.width)).toBeLessThan(TOLERANCE);
        expect(Math.abs(viewer.height - mosaic.height)).toBeLessThan(TOLERANCE);

        await expect(page.locator('.group-panel')).toHaveCount(0);
    });
});
