// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('../helpers');

const project = require('./embed.fixture.json');
const canvas = require('../multitarget/multitarget.fixture.json');

const PROJECT_URL = 'http://localhost:1234/embed-project.json';
const IMAGE = Buffer.from(canvas.img_url.split(',')[1], 'base64');

/**
 * @param {import('@playwright/test').Page} page
 * @param {string=} params
 */
async function openEmbed(page, params = '') {
    await page.route(PROJECT_URL, route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(project)
    }));

    await page.route(project.source, route => route.fulfill({
        contentType: 'image/png',
        body: IMAGE
    }));

    await page.goto(`${BASE_URL}/#/embed?url=${encodeURIComponent(PROJECT_URL)}${params}`);
    await page.waitForSelector('.a9s-annotation', { timeout: 30000 });
    await page.waitForTimeout(1500);
}

/**
 * @param {import('@playwright/test').Page} page
 */
function overlay(page) {
    return page.locator('[class*="anno-fullscreen"]');
}

test.describe('The embedded viewer, served offline', () => {

    test('opens the project image inside the embed', async ({ page }) => {
        await openEmbed(page);

        await expect(page.locator('#adno-embed')).toBeVisible();
        await expect(page.locator('.openseadragon-container')).toBeVisible();
        await expect(page.locator('.loader')).toHaveCount(0);
    });

    test('draws every zone of every annotation', async ({ page }) => {
        await openEmbed(page);

        await expect(page.locator('.a9s-annotation')).toHaveCount(3);
    });

    test('keeps the zones out of sight until they are asked for', async ({ page }) => {
        await openEmbed(page);

        await expect(page.locator('.a9s-annotation .a9s-inner').first())
            .toHaveClass(/a9s-annotation--hidden/);
    });

    test('shows the zones when anno_bounds is on', async ({ page }) => {
        await openEmbed(page, '&anno_bounds=true');

        await expect(page.locator('.a9s-annotation .a9s-inner').first())
            .not.toHaveClass(/a9s-annotation--hidden/);
    });

    test('walks the annotations from the toolbar', async ({ page }) => {
        await openEmbed(page);

        const margin = page.locator('#adno-content-margin');

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1200);
        await expect(margin).toContainText('ANNOTATION ONE');

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1200);
        await expect(margin).toContainText('ANNOTATION TWO');

        await page.locator('#previousAnno').click();
        await page.waitForTimeout(1200);
        await expect(margin).toContainText('ANNOTATION ONE');
    });

    test('frames the selected annotation', async ({ page }) => {
        await openEmbed(page);

        const zone = page.locator('.a9s-annotation').first();
        const width = () => zone.evaluate(node => node.getBoundingClientRect().width);

        const home = await width();

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1500);

        expect(await width()).toBeGreaterThan(home * 1.5);
    });

    test('anchors the content margin where the url asks for it', async ({ page }) => {
        await openEmbed(page, '&content_position=right');

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1200);

        const margin = page.locator('#adno-content-margin');

        await expect(margin).toBeVisible();
        await expect(margin).toHaveClass(/content-margin--right/);
        await expect(margin).toContainText('ANNOTATION ONE');
        await expect(overlay(page)).toHaveCount(0);
    });

    test('floats the content over the image when asked to', async ({ page }) => {
        await openEmbed(page, '&content_position=floating');

        await page.locator('#nextAnno').click();
        await page.waitForTimeout(1200);

        await expect(overlay(page)).toContainText('ANNOTATION ONE');
        await expect(page.locator('#adno-content-margin')).toHaveCount(0);
    });

    test('carries the project metadata in the info modal', async ({ page }) => {
        await openEmbed(page);

        await page.locator('#info label').click();

        const modal = page.locator('.modal-box').filter({ hasText: project.title });

        await expect(modal).toBeVisible();
        await expect(modal).toContainText(project.description);
        await expect(modal).toContainText(project.creator);
        await expect(modal).toContainText(project.rights);
    });
});
