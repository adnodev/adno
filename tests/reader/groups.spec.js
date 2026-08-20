// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');

const canvas = require('../multitarget/multitarget.fixture.json');

const PROJECT_ID = 'reader-groups-project';
const ANNOTATION_ID = '#two-groups';

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

/**
 * An annotation whose second group holds two zones and is flagged as a cutout:
 * the case that used to hand the cutout panel a raw multi-target annotation.
 *
 * @param {any} adno
 */
function projectWith(adno) {
    return {
        ...canvas,
        id: PROJECT_ID,
        title: 'Reader groups',
        description: 'One annotation split across two zone groups',
        annotations: [{
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            id: ANNOTATION_ID,
            type: 'Annotation',
            body: [
                { type: 'TextualBody', value: 'TWO GROUPS', purpose: 'commenting' },
                { type: 'HTMLBody', value: '<p>TWO GROUPS</p>', purpose: 'commenting' }
            ],
            adno,
            target: [
                target('g1', '40,40,120,90'),
                target('g2', '260,200,140,100'),
                target('g2', '420,60,90,70')
            ]
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
    await page.locator('.anno-card').first().locator('[data-icon="bullseye"]').click();
    await page.waitForTimeout(1500);
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [PROJECT_ID]);
});

test.describe('Reading an annotation split across groups', () => {

    test('every group but the active one gets a panel of its own', async ({ page }) => {
        await openViewer(page, projectWith(undefined));

        await expect(page.locator('.group-panel')).toHaveCount(1);
        await expect(page.locator('#group-osd-g2 canvas')).toBeVisible();
        await expect(page.locator('.group-overlay-badge')).toContainText('B');
    });

    test('a cutout group draws all of its zones instead of a black square', async ({ page }) => {
        await openViewer(page, projectWith({ cutouts: { g2: true } }));

        await expect(page.locator('.cutout-panel')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.cutout-body canvas')).toBeVisible();
        await expect(page.locator('.cutout-body .a9s-annotation')).toHaveCount(2);
    });

    test('the legacy cutout flag still covers the whole annotation', async ({ page }) => {
        await openViewer(page, projectWith({ cutout: true }));

        await expect(page.locator('.cutout-panel')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.cutout-body .a9s-annotation')).toHaveCount(3);
    });

    test('two cutout groups each get their own panel', async ({ page }) => {
        await openViewer(page, projectWith({ cutouts: { g1: true, g2: true } }));

        await expect(page.locator('.cutout-panel')).toHaveCount(2);
        await expect(page.locator('.cutout-body canvas')).toHaveCount(2);

        const boxes = await page.locator('.cutout-panel').evaluateAll(
            nodes => nodes.map(node => node.getBoundingClientRect().left));

        expect(boxes[0]).not.toEqual(boxes[1]);
    });
});
