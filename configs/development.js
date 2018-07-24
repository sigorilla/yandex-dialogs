const production = require('./production');

const development = {
    ...production,
    logger: {
        colorize: true,
        level: 'silly',
        timestamp: true
    }
};

module.exports = development;
