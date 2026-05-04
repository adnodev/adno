// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const FIXTURE = path.join(__dirname, 'orchestre-de-manettes.json');

const EXPECTED_AUDIO_URLS = [
    'https://b24-audiofiles.ausha.co/SKoefMqSxSeRyKgzF4rLd4J9fHu0QbHch306yYxY.mp3?token=1777447115-zBIIuAhlwM3iJRvzz2h6%2Bhz%2FbI%2FK9zjSI2GfE2BquHA%3D',
    'https://b23-audiofiles.ausha.co/z2wyN1X4L7X7fesJh7jYtWStTRqTFHScumNUM3Mj.mp3?token=1777447275-puI0Hu9fK%2B%2BnIt%2BoWMPhyYV%2Fj9e4I9Z%2FcZIJ2jrMu58%3D',
    'https://b23-audiofiles.ausha.co/4h1V7uIadVzIzMN7KfAv33ZTlMH7j8m4UdhwPkPw.mp3?token=1777447162-a2RsJlsIVp4tgpUSTJH6vNgGByjX5ZE6%2FZ%2F6IPipQrY%3D',
];

/**
 * @param {any} node
 * @param {Set<string>} [found]
 * @returns {Set<string>}
 */
function collectAudioUrls(node, found = new Set()) {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
        node.forEach(item => collectAudioUrls(item, found));
        return found;
    }
    if (node.type === 'Audio' && typeof node.id === 'string') {
        found.add(node.id);
    }
    Object.values(node).forEach(value => collectAudioUrls(value, found));
    return found;
}

/**
 * @param {import('@playwright/test').Download} download
 */
async function readDownloadAsJson(download) {
    const filePath = await download.path();
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function importIIIFFixtureWithAudio(page) {
    await page.goto('http://localhost:1234/#/');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Import a project').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE);

    // Validate import (success button has only an icon, no text)
    await page.getByRole('button').filter({ hasText: /^$/ }).first().click();

    await page.waitForURL(/\/project\/.+\/edit/);
    await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function openExportModal(page) {
    // The download button in the navbar opens the share/export modal
    await page.locator('label[for="my-modal"]').first().click();
    await expect(page.getByText(/Export as/i)).toBeVisible();
}

test.describe('Audio annotations are preserved on export', () => {

    test('Adno-format export preserves audio URLs', async ({ page }) => {
        await importIIIFFixtureWithAudio(page);
        await openExportModal(page);

        const downloadPromise = page.waitForEvent('download');
        await page.locator('a[id^="download_btn_"]').click();
        const download = await downloadPromise;

        const exported = await readDownloadAsJson(download);
        expect(exported.format).toBe('Adno');

        const audioUrls = [...collectAudioUrls(exported)];
        for (const url of EXPECTED_AUDIO_URLS) {
            expect(audioUrls).toContain(url);
        }
    });

    test('Adno-format round-trip (export → re-import) preserves audio URLs', async ({ page }) => {
        await importIIIFFixtureWithAudio(page);
        await openExportModal(page);

        // Step 1: export as Adno format and capture the file
        const downloadPromise = page.waitForEvent('download');
        await page.locator('a[id^="download_btn_"]').click();
        const download = await downloadPromise;
        const exportedPath = await download.path();

        // Step 2: re-import the Adno file we just exported
        await page.goto('http://localhost:1234/#/');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByText('Import a project').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(exportedPath);

        // Validate import; the Adno-format import path triggers window.location.reload()
        await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
        await page.waitForLoadState('networkidle');

        // Step 3: read the freshly persisted project straight out of IndexedDB and
        // verify the audio bodies survived the reload
        const persistedProjects = await page.evaluate(() => new Promise(resolve => {
            const req = indexedDB.open('ProjectsDB', 1);
            req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction(['projects'], 'readonly');
                const all = tx.objectStore('projects').getAll();
                all.onsuccess = () => resolve(all.result);
            };
        }));

        // Find the freshly imported project (most recent last_update)
        expect(Array.isArray(persistedProjects)).toBe(true);
        const reimported = persistedProjects.sort(
            (/** @type {any} */ a, /** @type {any} */ b) =>
                new Date(b.last_update).getTime() - new Date(a.last_update).getTime()
        )[0];

        const audioUrls = [...collectAudioUrls(reimported)];
        for (const url of EXPECTED_AUDIO_URLS) {
            expect(audioUrls).toContain(url);
        }
    });

    test('IIIF-format export preserves audio URLs', async ({ page }) => {
        // The IIIF exporter fetches the canvas info.json — stub it so the test
        // does not depend on the upstream IIIF server.
        await page.route('**/iiif.irht.cnrs.fr/**/info.json', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    '@context': 'http://iiif.io/api/image/3/context.json',
                    height: 4694,
                    width: 6584,
                }),
            });
        });

        await importIIIFFixtureWithAudio(page);
        await openExportModal(page);

        const downloadPromise = page.waitForEvent('download');
        await page.locator('label.btn-success').filter({ hasText: 'IIIF' }).click();
        const download = await downloadPromise;

        const exported = await readDownloadAsJson(download);
        expect(exported.type).toBe('Manifest');

        const audioUrls = [...collectAudioUrls(exported)];
        for (const url of EXPECTED_AUDIO_URLS) {
            expect(audioUrls).toContain(url);
        }
    });
});
