// @ts-check
//
// End-to-end locale check — needs the dev server running on BASE_URL.
// The app has no language switcher: `detectLanguage()` in langs/i18n_conf.js
// reads the browser locale (navigator.languages). Playwright lets us force that
// per test via `test.use({ locale })`, so each case boots Adno in one language
// and asserts the home page renders that locale's intro text (proving the right
// bundle was loaded, not the English fallback).

const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('../helpers');

/**
 * Browser locale -> language bundle that detectLanguage() should resolve to.
 * The values must trigger the matching branch in detectLanguage():
 *  - zh-CN -> zh-Hans, zh-TW -> zh-Hant (script disambiguation)
 */
const CASES = [
    { browserLocale: 'en-US', bundle: 'en' },
    { browserLocale: 'fr-FR', bundle: 'fr' },
    { browserLocale: 'es-ES', bundle: 'es' },
    { browserLocale: 'ja-JP', bundle: 'ja' },
    { browserLocale: 'ta-IN', bundle: 'ta' },
    { browserLocale: 'zh-CN', bundle: 'zh-Hans' },
    { browserLocale: 'zh-TW', bundle: 'zh-Hant' },
];

for (const { browserLocale, bundle } of CASES) {
    test.describe(`UI locale: ${bundle} (navigator=${browserLocale})`, () => {
        test.use({ locale: browserLocale });

        test('home renders the localized intro text', async ({ page }) => {
            // begin_msg exists in every bundle, so it is a safe anchor even for
            // partially translated locales.
            const expected = require(`../../langs/${bundle}.json`).begin_msg;

            await page.goto(`${BASE_URL}/#/`);

            await expect(page.locator('.adno_description')).toContainText(expected);
        });
    });
}
