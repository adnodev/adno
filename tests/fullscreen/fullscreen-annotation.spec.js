// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB } = require('../helpers');
const fixture = require('./project.fixture.json');

const CONTENT_1 = 'CONTENU_ANNOTATION_1';
const CONTENT_2 = 'CONTENU_ANNOTATION_2';

async function seedProject(page, project) {
    await page.goto(`${BASE_URL}/#/`);
    await page.evaluate((proj) => new Promise((resolve, reject) => {
        const req = indexedDB.open('ProjectsDB', 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id' });
            }
        };
        req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(['projects'], 'readwrite');
            tx.objectStore('projects').put(proj);
            tx.oncomplete = () => resolve(null);
            tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
    }), project);
}

async function openViewer(page) {
    await seedProject(page, fixture);
    await page.goto(`${BASE_URL}/#/project/${fixture.id}/view`);
    await expect(page.locator(`[id="anno_card_${fixture.annotations[0].id}"]`))
        .toBeVisible({ timeout: 30000 });
}

async function selectAnnotationFromSidebar(page, annoId) {
    await page.locator(`[id="anno_card_${annoId}"]`).locator('button').last().click();
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page, [fixture.id]);
});

test.describe('Plein écran — zone de contenu de l\'annotation', () => {

    test.skip(({ browserName }) => browserName !== 'chromium', 'Repro menée sur Chromium.');

    test('annotation sélectionnée → la zone s\'affiche en plein écran', async ({ page }) => {
        await openViewer(page);
        await selectAnnotationFromSidebar(page, fixture.annotations[0].id);

        await page.locator('#toggle-fullscreen').click();

        const zone = page.locator('#adno-osd-anno-fullscreen');
        await expect(zone).toBeVisible({ timeout: 5000 });
        await expect(zone).toContainText(CONTENT_1);
    });

    test('plein écran puis navigation clavier → la zone affiche l\'annotation courante', async ({ page }) => {
        await openViewer(page);

        await page.locator('#toggle-fullscreen').click();

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        const zone = page.locator('#adno-osd-anno-fullscreen');
        await expect(zone).toBeVisible({ timeout: 5000 });
        await expect(zone).toContainText(CONTENT_2);
    });

    test('la zone se met à jour quand on change d\'annotation', async ({ page }) => {
        await openViewer(page);

        await selectAnnotationFromSidebar(page, fixture.annotations[0].id);
        await page.locator('#toggle-fullscreen').click();

        const zone = page.locator('#adno-osd-anno-fullscreen');
        await expect(zone).toContainText(CONTENT_1);

        await page.keyboard.press('ArrowRight');

        await expect(zone).toContainText(CONTENT_2);
        await expect(zone).not.toContainText(CONTENT_1);
    });
});
