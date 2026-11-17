// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');
const fixture = require('./project.fixture.json');

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} settings
 */
async function openFullscreen(page, settings) {
    const project = {
        ...fixture,
        settings: { ...fixture.settings, ...settings }
    };

    await seedProject(page, project);
    await page.goto(`${BASE_URL}/#/project/${fixture.id}/view`);
    await expect(page.locator('#toggle-fullscreen')).toBeVisible({ timeout: 30000 });

    await page.locator('#toggle-fullscreen').click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
}

/**
 * @param {import('@playwright/test').Page} page
 */
function toolbarInsideFullscreen(page) {
    return page.evaluate(() => {
        const toolbar = document.querySelector('#toggle-fullscreen');

        return !!document.fullscreenElement && document.fullscreenElement.contains(toolbar);
    });
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id]);
});

test.describe('Plein écran — barre d\'outils', () => {

    test.skip(({ browserName }) => browserName !== 'chromium', 'Repro menée sur Chromium.');

    test('réglage activé → la barre est affichée dans le plein écran', async ({ page }) => {
        await openFullscreen(page, { toolsbarOnFs: true });

        expect(await toolbarInsideFullscreen(page)).toBe(true);
        await expect(page.locator('.osd-buttons-bar')).toBeVisible();
        await expect(page.locator('.osd-buttons-bar-hidden')).toHaveCount(0);
    });

    test('réglage désactivé → la barre est masquée dans le plein écran', async ({ page }) => {
        await openFullscreen(page, { toolsbarOnFs: false });

        await expect(page.locator('.osd-buttons-bar-hidden')).toHaveCount(1);
        await expect(page.locator('#toggle-fullscreen')).toBeHidden();
    });

    test('réglage désactivé → la barre revient en quittant le plein écran', async ({ page }) => {
        await openFullscreen(page, { toolsbarOnFs: false });

        await page.evaluate(() => document.exitFullscreen());

        await expect(page.locator('#toggle-fullscreen')).toBeVisible();
    });

    test('réglage activé → la marge de contenu commence sous la barre', async ({ page }) => {
        await openFullscreen(page, { toolsbarOnFs: true, contentPosition: 'left' });

        const zone = page.locator('#adno-content-margin');
        await expect(zone).toBeVisible({ timeout: 5000 });

        const bar = await page.locator('.osd-buttons-bar').boundingBox();
        const content = await zone.boundingBox();

        expect(content.y).toBeGreaterThanOrEqual(bar.y + bar.height);
    });
});
