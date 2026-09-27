// @ts-check

const { test, expect } = require('@playwright/test');
const { BASE_URL, clearProjectsDB, readProjects } = require('../helpers');

const exported = require('./adno-export.fixture.json');

test.afterEach(async ({ page }) => {
    await clearProjectsDB(page);
});

test.describe('Importing a project that carries multi-zone annotations', () => {

    test('every zone survives the trip through the adno json', async ({ page }) => {
        await page.goto(`${BASE_URL}/#/`);

        await page.locator('#selectFiles_1').setInputFiles({
            name: 'adno-export.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(exported))
        });

        await page.locator('.import-btns button.btn-success').click();
        await page.waitForTimeout(2000);

        const projects = await readProjects(page);
        const imported = projects.find(project => project.title === exported.title);

        expect(imported, 'the imported project should be stored').toBeTruthy();
        expect(imported.annotations).toHaveLength(1);

        const original = exported.first.items[0];
        const target = imported.annotations[0].target;

        expect(target).toHaveLength(2);
        expect(target[0].source).toEqual(original.target[0].source);
        expect(target[1].source).toEqual(original.target[1].source);
        expect(target[0].selector.value).toEqual(original.target[0].selector.value);
        expect(target[1].selector.value).toEqual(original.target[1].selector.value);
    });
});
