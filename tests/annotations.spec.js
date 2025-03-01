// // @ts-check
// const { test, expect } = require('@playwright/test');

// test('should create project and create an annotation', async ({ page }) => {
//     await page.goto('http://localhost:1234/#/');
//     await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').click();
//     await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('baas');
//     await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').press('ControlOrMeta+a');
//     await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('https://bastaire.msh.uca.fr/iiif/3/10243/manifest');
//     await page.getByRole('button', { name: 'Create my own project' }).click();
//     await page.getByRole('button', { name: 'Use this picture for my' }).click();
//     await page.getByPlaceholder('Add a title to your project').click();
//     await page.getByPlaceholder('Add a title to your project').fill('Bastaire project');
//     await page.getByPlaceholder('Add a little text to describe').click();
//     await page.getByPlaceholder('Add a little text to describe').fill('Bastaire description');
//     await page.getByRole('button', { name: 'Create my new project' }).click();
    
//     await page.getByLabel('Create a Polygon annotation').click();
//     await page.locator('#openseadragon1 svg').click();
//     await page.locator('#openseadragon1 svg').click();
//     await page.locator('#openseadragon1 svg').click();
//     await page.locator('#openseadragon1 svg').click();
//     await page.locator('#openseadragon1 path').nth(1).click();
//     await page.locator('div').filter({ hasText: /^First an$/ }).nth(2).fill('First annotation');
//     await page.getByRole('button', { name: 'Save' }).click();
//     await expect(page.getByText('First annotation')).toBeVisible();
// });