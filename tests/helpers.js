// @ts-check

const BASE_URL = 'http://localhost:1234';

/**
 * Wipe Adno's IndexedDB store so a test leaves no residue behind. By default,
 * Playwright already isolates each test in its own browser context (and
 * therefore its own IndexedDB), so this is a belt-and-suspenders guarantee:
 *  - tests stay idempotent if isolation is ever loosened,
 *  - tests stay self-contained if multiple tests later share a context.
 *
 * Pass an array of project IDs to delete only those (surgical cleanup);
 * pass nothing to wipe the whole `projects` store.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]=} ids
 */
async function clearProjectsDB(page, ids) {
    try {
        await page.goto(`${BASE_URL}/#/`).catch(() => {});
        await page.evaluate((targets) => new Promise((resolve) => {
            const req = indexedDB.open('ProjectsDB', 1);
            req.onerror = () => resolve(null);
            req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('projects')) {
                    resolve(null);
                    return;
                }
                const tx = db.transaction(['projects'], 'readwrite');
                const store = tx.objectStore('projects');
                if (targets && targets.length) {
                    targets.forEach(id => store.delete(id));
                } else {
                    store.clear();
                }
                tx.oncomplete = () => resolve(null);
                tx.onerror = () => resolve(null);
            };
        }), ids);
    } catch (_) {
        // Page might already be closed — nothing to do.
    }
}

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

module.exports = { BASE_URL, clearProjectsDB, seedProject };
