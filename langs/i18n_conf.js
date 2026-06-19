import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import French from './fr.json';
import English from './en.json';
import Spanish from './es.json';
import Japanese from './ja.json';
import Tamil from './ta.json';
import ChineseSimplified from './zh-Hans.json';
import ChineseTraditional from './zh-Hant.json';

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
    if (locale.startsWith('ja')) return 'ja';
    if (locale.startsWith('ta')) return 'ta';
    if (locale.startsWith('zh')) {
        if (/^zh-(hant|tw|hk|mo)/.test(locale)) return 'zh-Hant';
        return 'zh-Hans';
    }

    return 'en';
}

const detectedLanguage = detectLanguage();

const resources = {
    en: { translation: English },
    fr: { translation: French },
    es: { translation: Spanish },
    ja: { translation: Japanese },
    ta: { translation: Tamil },
    'zh-Hans': { translation: ChineseSimplified },
    'zh-Hant': { translation: ChineseTraditional }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: ['en', 'fr', 'es', 'ja', 'ta', 'zh-Hans', 'zh-Hant'],
        lng: detectedLanguage,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });
