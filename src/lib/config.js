const assert = require('assert');
const configs = require('../../configs');

const APP_ENV = process.env.ENVIRONMENT || 'development';
assert(configs.has(APP_ENV), `There is no configuration for environment ${APP_ENV}`);

module.exports = configs.get(APP_ENV);
