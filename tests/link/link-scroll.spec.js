// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('../helpers');

const SCROLLER = '.link-generator';
const SETTING_TOGGLES = '.link-generator input.toggle-toolsbar';

test.describe('LinkGenerator page scrolling', () => {
    test('the settings column overflows its own scroll container', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/link`);

        const scroller = page.locator(SCROLLER);
        await expect(scroller).toBeVisible();

        const overflow = await scroller.evaluate(el => el.scrollHeight - el.clientHeight);
        expect(overflow).toBeGreaterThan(0);
    });

    test('a wheel gesture brings the last setting into view', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/link`);

        const scroller = page.locator(SCROLLER);
        await expect(scroller).toBeVisible();

        const lastSetting = page.locator(SETTING_TOGGLES).last();
        await expect(lastSetting).not.toBeInViewport();

        await page.mouse.move(200, 400);
        for (let i = 0; i < 10; i++) {
            await page.mouse.wheel(0, 1000);
        }

        await expect.poll(() => scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
        await expect(lastSetting).toBeInViewport();
    });
});
