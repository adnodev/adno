// @ts-check
const { test, expect } = require('@playwright/test');
import path from 'path'

test('should import https://bastaire.msh.uca.fr/iiif/3/10243/manifest as project', async ({ page }) => {
  await page.goto('http://localhost:1234/#/');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').click();
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('baas');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').press('ControlOrMeta+a');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('https://bastaire.msh.uca.fr/iiif/3/10243/manifest');
  await page.getByRole('button', { name: 'Create my own project' }).click();
  await page.getByRole('button', { name: 'Use this picture for my' }).click();
  await page.getByPlaceholder('Add a title to your project').click();
  await page.getByPlaceholder('Add a title to your project').fill('Bastaire project');
  await page.getByPlaceholder('Add a little text to describe').click();
  await page.getByPlaceholder('Add a little text to describe').fill('Bastaire description');
  await page.getByRole('button', { name: 'Create my new project' }).click();
  await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
});

test('should https://static.emf.fr/adno/bsg/annotations.json detect as adno project', async ({ page }) => {
  await page.goto('http://localhost:1234/#/');
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').click();
  await page.getByPlaceholder('https://iiif.emf.fr/iiif/3/').fill('https://static.emf.fr/adno/bsg/annotations.json');
  await page.getByRole('button', { name: 'Create my own project' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.a9s-annotationlayer')).toBeVisible();
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