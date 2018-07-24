const production = require('./production');
const development = require('./development');

module.exports = new Map([
    ['production', production],
    ['development', development]
]);
