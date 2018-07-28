const assert = require('assert');
const express = require('express');
const Boom = require('boom');
const logger = require('./lib/logger');
const witchHandler = require('./v1/witch');

const app = express()
    .disable('x-powered-by')
    .get('/ping', (req, res) => res.end())
    .use(express.json())
    .use('/v1', express.Router()
        .post('/witch', witchHandler)
    )
    .use((req, res, next) => next(Boom.notFound('Endpoint not found')))
    // eslint-disable-next-line no-unused-vars
    .use((err, req, res, next) => {
        if (err.isBoom) {
            sendError(res, err);
        } else {
            logger.error(err.stack || err);
            sendError(res, Boom.internal());
        }
    });

function sendError(res, err) {
    res.status(err.output.statusCode).json(err.output.payload);
}

module.exports = app;

if (!module.parent) {
    let customPort;
    if (process.env.PORT !== undefined) {
        customPort = parseInt(process.env.PORT, 10);
        assert(!isNaN(customPort), 'Environment variable PORT must be an integer');
    }
    const port = customPort || 8080;
    app.listen(port, () => {
        logger.info(`Application started on port ${port}`);
    });
}
