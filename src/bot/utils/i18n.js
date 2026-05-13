const en = require('../locales/en.json');
const es = require('../locales/es.json');
const { getGuildSettings } = require('../../database/models/guild');

const locales = { en, es };
const DEFAULT_LANG = 'en';

/**
 * Get a translation string by dot-notation key.
 * Supports {placeholder} interpolation.
 */
function t(lang, key, vars = {}) {
    const locale = locales[lang] || locales[DEFAULT_LANG];
    const fallback = locales[DEFAULT_LANG];

    const parts = key.split('.');
    let val = locale;
    for (const p of parts) {
        val = val?.[p];
        if (val === undefined) break;
    }

    if (val === undefined) {
        val = fallback;
        for (const p of parts) {
            val = val?.[p];
            if (val === undefined) break;
        }
    }

    if (val === undefined) return key;
    if (typeof val !== 'string') return val;

    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/**
 * Create a bound translation function for a specific guild language.
 */
function getTranslator(lang) {
    return (key, vars) => t(lang || DEFAULT_LANG, key, vars);
}

/**
 * Get translator for a guild by fetching its language setting.
 */
async function getGuildTranslator(guildId) {
    const settings = await getGuildSettings(guildId);
    return getTranslator(settings.language || DEFAULT_LANG);
}

module.exports = { t, getTranslator, getGuildTranslator, DEFAULT_LANG };
