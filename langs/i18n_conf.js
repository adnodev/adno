import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import langs
import French from './fr.json';
import English from './en.json';
import Spanish from './es.json'; 

const locale = navigator.language;

i18n
    .use(initReactI18next)
    .init({
        resources: { ...English, ...French, ...Spanish },
        lng: locale === "fr" || locale === "fr-FR"
            ? "fr"
            : locale === "es" || locale === "es-ES"
            ? "es"
            : "en", 
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });
