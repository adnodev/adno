// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');
const wideFixture = require('./wide.fixture.json');
const tallFixture = require('./tall.fixture.json');
const normalFixture = require('./normal.fixture.json');

test.describe('AdnoNavigator positioning', () => {
    test.afterEach(async ({ page }) => {
        await clearProjectsDB(page);
    });

    test('horizontal rouleau: navigator anchors bottom-center', async ({ page }) => {
        await seedProject(page, wideFixture);
        await page.goto(`${BASE_URL}/#/project/${wideFixture.id}/view`);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--bottom-center/);
    });

    test('vertical rouleau: navigator anchors right-vertical', async ({ page }) => {
        await seedProject(page, tallFixture);
        await page.goto(`${BASE_URL}/#/project/${tallFixture.id}/view`);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--right-vertical/);
    });

    test('regular image: navigator stays bottom-right', async ({ page }) => {
        await seedProject(page, normalFixture);
        await page.goto(`${BASE_URL}/#/project/${normalFixture.id}/view`);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--bottom-right/);
    });

    test('view mode honours showNavigator: toggling it off hides the navigator', async ({ page }) => {
        await seedProject(page, normalFixture);
        await page.goto(`${BASE_URL}/#/project/${normalFixture.id}/view`);

        await expect(page.locator('.adno-navigator-wrap')).toBeVisible({ timeout: 30000 });

        await page.locator('button.navbar-button svg[data-icon="gear"]').first().click();
        await page.locator('.toggle-navigator').first().click();
        await page.getByRole('button', { name: /save/i }).click();

        await expect(page.locator('.adno-navigator-wrap')).toHaveCount(0);
    });
});
