import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import French from './fr.json';
import English from './en.json';
import Spanish from './es.json';

function getBrowserLocale() {
    try {
        const locale =
            navigator.languages?.[0] ||
            navigator.language ||
            navigator.userLanguage ||
            'en';

        return locale;
    } catch (err) {
        return 'en';
    }
}

function detectLanguage() {
    const locale = getBrowserLocale().toLowerCase();

    if (locale.startsWith('fr')) return 'fr';
    if (locale.startsWith('es')) return 'es';
    if (locale.startsWith('en')) return 'en';

    return 'en';
}

const detectedLanguage = detectLanguage();

const resources = {
    en: { translation: English },
    fr: { translation: French },
    es: { translation: Spanish }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: ['en', 'fr', 'es'],
        lng: detectedLanguage,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });
