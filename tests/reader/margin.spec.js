// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');

const canvas = require('../multitarget/multitarget.fixture.json');

const PROJECT_ID = 'reader-margin-project';

/**
 * @param {string} id
 * @param {any[]} body
 * @param {string} fragment
 */
function annotation(id, body, fragment) {
    return {
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id,
        type: 'Annotation',
        body,
        target: {
            source: canvas.img_url,
            selector: {
                type: 'FragmentSelector',
                conformsTo: 'http://www.w3.org/TR/media-frags/',
                value: `xywh=pixel:${fragment}`
            }
        }
    };
}

const RICH = annotation('#rich', [
    { type: 'TextualBody', value: 'MARGIN TEXT', purpose: 'commenting' },
    { type: 'HTMLBody', value: '<p>MARGIN TEXT</p>', purpose: 'commenting' },
    { type: 'TextualBody', value: 'alpha', purpose: 'tagging' }
], '40,40,120,90');

const EMPTY = annotation('#empty', [], '260,200,140,100');

/**
 * @param {string} position
 * @param {boolean} sidebarEnabled
 */
function projectWith(position, sidebarEnabled = true) {
    return {
        ...canvas,
        id: PROJECT_ID,
        title: 'Margin',
        description: 'Annotation content shown beside the image',
        settings: { ...canvas.settings, contentPosition: position, sidebarEnabled },
        annotations: [RICH, EMPTY]
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
    await page.waitForTimeout(1200);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} index
 */
function focus(page, index) {
    return page.locator('.anno-card').nth(index).click();
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [PROJECT_ID]);
});

test.describe('Annotation content in a margin', () => {

    for (const position of ['left', 'right', 'bottom']) {
        test(`the ${position} margin carries the text and the tags`, async ({ page }) => {
            await openViewer(page, projectWith(position));
            await focus(page, 0);

            const margin = page.locator('#adno-content-margin');

            await expect(margin).toBeVisible();
            await expect(margin).toHaveClass(new RegExp(`content-margin--${position}`));
            await expect(margin).toContainText('MARGIN TEXT');
            await expect(margin.locator('.content-margin-tag')).toHaveText(['alpha']);
        });
    }

    test('the margin lives inside the element that goes fullscreen', async ({ page }) => {
        await openViewer(page, projectWith('left'));
        await focus(page, 0);

        await expect(page.locator('#adno-osd #adno-content-margin')).toHaveCount(1);
    });

    test('a floating setting keeps the margin away', async ({ page }) => {
        await openViewer(page, projectWith('floating'));
        await focus(page, 0);

        await expect(page.locator('#adno-content-margin')).toHaveCount(0);
    });

    test('an annotation with nothing to say opens no margin', async ({ page }) => {
        await openViewer(page, projectWith('left'));
        await focus(page, 1);

        await expect(page.locator('#adno-content-margin')).toHaveCount(0);
    });

    test('the margin still shows when the annotation list is hidden', async ({ page }) => {
        await openViewer(page, projectWith('left', false));

        await expect(page.locator('.anno-card')).toHaveCount(0);

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1200);

        await expect(page.locator('#adno-content-margin')).toBeVisible();
        await expect(page.locator('#adno-content-margin')).toContainText('MARGIN TEXT');
    });
});
