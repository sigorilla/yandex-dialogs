const {Logger, transports} = require('winston');
const config = require('./config');

const logger = new Logger();

logger.add(transports.Console, {
    ...config.logger,
    debugStdout: true
});

module.exports = logger;
