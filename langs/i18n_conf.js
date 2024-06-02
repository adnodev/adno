import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import langs
import French from './fr.json';
import English from './en.json';

const locale = "fr"//navigator.language;

i18n
    .use(initReactI18next)
    .init({
        resources: { ...English, ...French },
        lng: locale === "fr" || locale === "fr-FR" ? "fr" : "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

