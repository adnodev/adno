// @ts-check
const { test, expect } = require('@playwright/test');
import path from 'path'

test('should import https://bastaire.msh.uca.fr/iiif/3/10243/manifest as project', async ({ page }) => {
  await loadImageProjectFromURL(page, 'https://bastaire.msh.uca.fr/iiif/3/10243/manifest')
});

test('should https://static.emf.fr/adno/bsg/annotations.json detect as adno project', async ({ page }) => {
  await loadProjectFromURL(page, 'https://static.emf.fr/adno/bsg/annotations.json');
});

test('should load IIFF export files successfully', async ({ page }) => {
  await page.goto('http://localhost:1234/#/');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Import a project').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, 'assets', 'iiif_export.json'));

  await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
  await expect(page.locator('g:nth-child(2) > .a9s-inner')).toBeVisible();
  await expect(page.locator('.a9s-inner').first()).toBeVisible();
  await expect(page.locator('g:nth-child(4) > .a9s-inner')).toBeVisible();
  await expect(page.locator('rect').nth(4)).toBeVisible();
  await expect(page.locator('rect').nth(2)).toBeVisible();
})

async function loadProjectFromURL(page, url) {
  await page.goto('http://localhost:1234/#/');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').click();
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill(url);
  await page.getByRole('button', { name: 'Create my own project' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
}

async function loadImageProjectFromURL(page, url) {
  await page.goto('http://localhost:1234/#/');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').click();
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('baas');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').press('ControlOrMeta+a');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill(url);
  await page.getByRole('button', { name: 'Create my own project' }).click();
  await page.getByRole('button', { name: 'Use this picture for my' }).click();
  await page.getByPlaceholder('Add a title to your project').click();
  await page.getByPlaceholder('Add a title to your project').fill('Project');
  await page.getByPlaceholder('Add a little text to describe').click();
  await page.getByPlaceholder('Add a little text to describe').fill('Description');
  await page.getByRole('button', { name: 'Create my new project' }).click();
  await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
}

test('should import https://drive.google.com/uc?export=download&id=1RP2D_N_-zMbDRmAqP2iJ0Rq4tVtDDC7g', async ({ page }) => {
  await loadProjectFromURL(page, "https://drive.google.com/uc?export=download&id=1RP2D_N_-zMbDRmAqP2iJ0Rq4tVtDDC7g")
});

async function loadV3(page, url) {
  await page.goto('http://localhost:1234/#/');
  await page.getByRole('textbox', { name: 'https://iiif.emf.fr/iiif/3/' }).click();
  await page.getByRole('textbox', { name: 'https://iiif.emf.fr/iiif/3/' }).fill(url);
  await page.getByRole('button', { name: 'Create my own project' }).click();
  await page.getByRole('textbox', { name: 'Title' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('proket');
  await page.getByRole('button', { name: 'Create my new project' }).click();
}

test('should import manifest v3', async ({ page }) => {
  await loadV3(page, 'https://iiif.emf.fr/iiif/3/SuomiNPP_earth_full.jp2/info.json');
  await loadV3(page, 'https://iiif.omnesviae.org/image/peutinger.tiff/info.json');
})

test('should import URL with encoded param', async ({ page }) => {
  // await loadV3(page, 'https://nasa.emf.fr/iiif/3/iss072e574632%2Fiss072e574632/info.json');
  await loadV3(page, 'https://iiif.mexina.fr/iiif/3/Lulu2%2FjExEpoyO89.JPG/info.json');
})

test('shoud load resource with nested service field', async ({ page }) => {
  // await page.goto('http://localhost:1234/#/');
  // await page.getByRole('textbox', { name: 'https://iiif.emf.fr/iiif/3/' }).click();
  await loadImageProjectFromURL(page, 'https://apicollections.parismusees.paris.fr/iiif/320144731/manifest')
  // await page.getByRole('textbox', { name: 'https://iiif.emf.fr/iiif/3/' }).fill('https://apicollections.parismusees.paris.fr/iiif/320144731/manifest');
  // await page.getByRole('button', { name: 'Create my own project' }).click();
  // await page.getByRole('button', { name: 'Use this picture for my' }).click();
  // await page.getByRole('textbox', { name: 'Title' }).click();
  // await page.getByRole('textbox', { name: 'Title' }).fill('Musee');
  // await page.getByRole('button', { name: 'Create my new project' }).click();
  // await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
})

