// @ts-check
//
// Static i18n checks — no browser, no dev server needed.
// `en.json` is the reference (it is the i18next `fallbackLng`): every other
// locale must expose exactly the same set of leaf keys, with no empty values.
//
// These tests read the JSON files directly, so they run in milliseconds and
// catch the most common translation regressions: a key added to `en` but not
// translated elsewhere (-> silent English fallback in the UI), a stale key left
// behind after a rename, or a key translated to an empty string.

const { test, expect } = require('@playwright/test');

const en = require('../../langs/en.json');

/** Locales to check against `en` — keep in sync with langs/i18n_conf.js. */
const LOCALES = {
    fr: require('../../langs/fr.json'),
    es: require('../../langs/es.json'),
    ja: require('../../langs/ja.json'),
    ta: require('../../langs/ta.json'),
    'zh-Hans': require('../../langs/zh-Hans.json'),
    'zh-Hant': require('../../langs/zh-Hant.json'),
};

/**
 * Flatten a nested translation object into dot-separated leaf keys.
 * @param {Record<string, any>} obj
 * @param {string} prefix
 * @param {Record<string, string>} out
 * @returns {Record<string, string>}
 */
function flatten(obj, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            flatten(v, key, out);
        } else {
            out[key] = v;
        }
    }
    return out;
}

const enFlat = flatten(en);
const enKeys = Object.keys(enFlat);

for (const [name, dict] of Object.entries(LOCALES)) {
    test.describe(`i18n: ${name}`, () => {
        const flat = flatten(dict);
        const keys = Object.keys(flat);

        test('has no missing keys (vs en)', () => {
            const missing = enKeys.filter((k) => !(k in flat));
            expect(missing, `Keys present in en.json but missing in ${name}.json`).toEqual([]);
        });

        test('has no stale keys (absent from en)', () => {
            const extra = keys.filter((k) => !(k in enFlat));
            expect(extra, `Keys present in ${name}.json but no longer in en.json`).toEqual([]);
        });

        test('has no empty translations', () => {
            const empty = keys.filter((k) => typeof flat[k] === 'string' && flat[k].trim() === '');
            expect(empty, `Keys translated to an empty string in ${name}.json`).toEqual([]);
        });
    });
}
