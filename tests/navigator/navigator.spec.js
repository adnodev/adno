// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, seedProject } = require('../helpers');
const wideFixture = require('./wide.fixture.json');

/**
 * Create a project the same way a user does: type a IIIF info.json URL on the
 * home page, click "Create my own project", fill the title, then click
 * "Create my new project". Returns the project id parsed from the URL the app
 * lands on (so the test can clean it up afterwards if needed).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} iiifUrl
 */
async function createProjectFromIIIF(page, iiifUrl) {
    await page.goto(`${BASE_URL}/#/`);

    const urlInput = page.getByRole('textbox', { name: 'https://iiif.emf.fr/iiif/3/' });
    await urlInput.click();
    await urlInput.fill(iiifUrl);

    await page.getByRole('button', { name: 'Create my own project' }).click();

    const title = page.getByRole('textbox', { name: 'Title' });
    await title.click();
    await title.fill('Navigator test');

    await page.getByRole('button', { name: 'Create my new project' }).click();

    await page.waitForURL(/\/project\/([^/]+)\/edit/, { timeout: 30000 });
    const match = page.url().match(/\/project\/([^/]+)\/edit/);
    if (!match) throw new Error(`Unexpected post-create URL: ${page.url()}`);
    return match[1];
}

test.describe('AdnoNavigator positioning (via real UI flow)', () => {
    // Real IIIF info.json from Manchester (MS Latin 2) — extremely tall rouleau.
    const VERTICAL_IIIF   = 'https://image.digitalcollections.manchester.ac.uk/iiif/MS-LATIN-00002-000-00001.jp2/info.json';
    // Normal-ratio IIIF info.json, already used by other specs (SuomiNPP earth, square-ish).
    const NORMAL_IIIF     = 'https://iiif.emf.fr/iiif/3/SuomiNPP_earth_full.jp2/info.json';

    test.afterEach(async ({ page }) => {
        // Wipe only this context's IndexedDB so the test leaves no residue.
        // Playwright already isolates contexts per test; this is the explicit
        // belt-and-suspenders the suite contracts for.
        await clearProjectsDB(page);
    });

    test('horizontal rouleau: navigator anchors bottom-center', async ({ page }) => {
        await seedProject(page, wideFixture);
        await page.goto(`${BASE_URL}/#/project/${wideFixture.id}/view`);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--bottom-center/);
    });

    test('vertical rouleau (Manchester MS Latin 2): navigator anchors right-vertical', async ({ page }) => {
        await createProjectFromIIIF(page, VERTICAL_IIIF);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--right-vertical/);
    });

    test('regular image (SuomiNPP): navigator stays bottom-right', async ({ page }) => {
        await createProjectFromIIIF(page, NORMAL_IIIF);

        const wrap = page.locator('.adno-navigator-wrap');
        await expect(wrap).toBeVisible({ timeout: 30000 });
        await expect(wrap).toHaveClass(/adno-navigator-wrap--bottom-right/);
    });

    test('view mode honours showNavigator: toggling it off hides the navigator', async ({ page }) => {
        // 1. Create the project as a user would.
        await createProjectFromIIIF(page, NORMAL_IIIF);

        // 2. Switch from edit mode to view mode using the navbar toggle.
        const editViewToggle = page.locator('.toggle-success').first();
        await editViewToggle.click();
        await page.waitForURL(/\/project\/[^/]+\/view/, { timeout: 15000 });

        // 3. Navigator should be visible by default in view mode (showNavigator=true).
        await expect(page.locator('.adno-navigator-wrap')).toBeVisible({ timeout: 30000 });

        // 4. Open the settings modal and flip showNavigator off.
        await page.locator('button.navbar-button svg[data-icon="gear"]').first().click();
        await page.locator('.toggle-navigator').first().click();
        await page.getByRole('button', { name: /save/i }).click();

        // 5. Navigator should disappear.
        await expect(page.locator('.adno-navigator-wrap')).toHaveCount(0);
    });
});
