const i18next = require('i18next');
const config = require('../lib/config');
const logger = require('../lib/logger');
const resources = require('../lib/resources');

i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    whitelist: Object.keys(config.witch.hosts),
    ns: Object.keys(resources),
    resources
}, (err) => {
    if (err) {
        logger.error(`Cannot init i18n: ${err}`);
    }
});

module.exports = (ns) => async (ctx) => {
    const {locale} = ctx.req.meta || {};
    let i18n;
    await new Promise((resolve) => {
        i18n = i18next.cloneInstance({
            lng: locale.split('-')[0],
            defaultNS: ns
        }, (err) => {
            if (err) {
                logger.error(`Cannot clone i18n instance: ${err}`);
            }
            resolve();
        });
    });

    Object.defineProperty(ctx, 'i18n', {
        get() {
            return i18n;
        }
    });

    return ctx;
};
