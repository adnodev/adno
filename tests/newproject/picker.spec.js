// @ts-check
const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB } = require('../helpers');
const canvas = require('../fullscreen/project.fixture.json');

const MANIFEST_URL = 'http://localhost:1234/picker-manifest.json';
const SERVICE = 'http://localhost:1234/picker-iiif';
const IMAGE = Buffer.from(canvas.img_url.split(',')[1], 'base64');

function canvasItem(index) {
    const id = `${MANIFEST_URL}/canvas/${index}`;

    return {
        id,
        type: 'Canvas',
        width: 400,
        height: 300,
        items: [{
            id: `${id}/page`,
            type: 'AnnotationPage',
            items: [{
                id: `${id}/painting`,
                type: 'Annotation',
                motivation: 'painting',
                target: id,
                body: {
                    id: `${SERVICE}/image-${index}/full/max/0/default.jpg`,
                    type: 'Image',
                    format: 'image/jpeg',
                    service: [{ id: `${SERVICE}/image-${index}`, type: 'ImageService3', profile: 'level1' }]
                }
            }]
        }]
    };
}

const manifest = {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: MANIFEST_URL,
    type: 'Manifest',
    label: { en: ['Picker manifest'] },
    items: [canvasItem(1), canvasItem(2)]
};

const singleImageManifest = {
    ...manifest,
    items: [canvasItem(1)]
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} servedManifest
 * @returns {Promise<() => void>}
 */
async function openNewProject(page, servedManifest) {
    let release = () => {};
    const gate = new Promise(resolve => {
        release = () => resolve(null);
    });

    await page.route(MANIFEST_URL, async route => {
        await gate;
        await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(servedManifest)
        });
    });

    await page.route(`${SERVICE}/**`, route => route.fulfill({
        contentType: 'image/png',
        body: IMAGE
    }));

    await page.goto(`${BASE_URL}/#/`);
    await page.evaluate(url => {
        localStorage.setItem('adno_image_url', url);
        localStorage.removeItem('selected_canva');
    }, MANIFEST_URL);

    await page.goto(`${BASE_URL}/#/new`);
    await expect(page.locator('.new-project')).toBeAttached();

    return release;
}

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page);
});

test.describe('Nouveau projet — manifeste à plusieurs images', () => {

    test('le formulaire reste masqué pendant la lecture du manifeste', async ({ page }) => {
        const release = await openNewProject(page, manifest);

        await expect(page.locator('.form-new-project')).toHaveCount(0);

        release();

        await expect(page.locator('#select_canva img')).toBeVisible();
        await expect(page.locator('.form-new-project')).toHaveCount(0);
    });

    test('le sélecteur affiche la vignette de chaque image', async ({ page }) => {
        const release = await openNewProject(page, manifest);
        release();

        const thumbnail = page.locator('#select_canva img');

        await expect(thumbnail).toHaveAttribute('src', `${SERVICE}/image-1/full/300,/0/default.jpg`);
        await expect.poll(() => thumbnail.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);

        await page.getByRole('button', { name: '❯' }).click();

        await expect(thumbnail).toHaveAttribute('src', `${SERVICE}/image-2/full/300,/0/default.jpg`);
        await expect.poll(() => thumbnail.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    });

    test('le formulaire apparaît une fois l\'image choisie', async ({ page }) => {
        const release = await openNewProject(page, manifest);
        release();

        await page.getByRole('button', { name: 'Use this picture for my' }).click();

        await expect(page.locator('.form-new-project')).toBeVisible();
        await expect(page.locator('#select_canva img')).toHaveCount(0);

        const selected = await page.evaluate(() => localStorage.getItem('selected_canva'));
        expect(selected).toBe(`${SERVICE}/image-1/info.json`);
    });
});

test.describe('Nouveau projet — manifeste à une seule image', () => {

    test('le formulaire s\'affiche sans passer par le sélecteur', async ({ page }) => {
        const release = await openNewProject(page, singleImageManifest);
        release();

        await expect(page.locator('.form-new-project')).toBeVisible();
        await expect(page.locator('#select_canva img')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Use this picture for my' })).toHaveCount(0);

        const selected = await page.evaluate(() => localStorage.getItem('selected_canva'));
        expect(selected).toBe(`${SERVICE}/image-1/info.json`);
    });

    test('le formulaire propose d\'annuler plutôt que de revenir au sélecteur', async ({ page }) => {
        const release = await openNewProject(page, singleImageManifest);
        release();

        await expect(page.locator('.form-new-project #cancel_creation')).toBeVisible();
        await expect(page.locator('.form-new-project #annuler_creation')).toHaveCount(0);
    });
});
