const path = require('path');

const locales = {
    en: require('./locales/en.json'),
    es: require('./locales/es.json')
};

const DEFAULT_LANG = 'en';
const SUPPORTED = Object.keys(locales);

// Get nested key from object: t('nav.login') => locales[lang].nav.login
function resolve(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

// Express middleware — sets res.locals.t and res.locals.lang
function i18nMiddleware(req, res, next) {
    // Priority: query ?lang= > cookie > Accept-Language header > default
    let lang = req.query.lang || req.cookies?.lang;

    if (!lang) {
        const accept = req.headers['accept-language'] || '';
        if (accept.startsWith('es')) lang = 'es';
    }

    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;

    // Persist choice in cookie when explicitly set via query
    if (req.query.lang && SUPPORTED.includes(req.query.lang)) {
        res.cookie('lang', req.query.lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    const locale = locales[lang];

    res.locals.lang = lang;
    res.locals.langs = SUPPORTED.map(l => ({ code: l, name: locales[l].langName }));
    res.locals.t = (key) => resolve(locale, key) ?? resolve(locales[DEFAULT_LANG], key) ?? key;

    next();
}

module.exports = { i18nMiddleware, locales, SUPPORTED };
