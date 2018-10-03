const http = require('http');
const express = require('express');
const Raven = require('raven');
const path = require('path');
const SimpleLogger = require('./lib/Logging/SimpleLogger');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redis = new (require('./lib/DB/Redis'))(
    {
        password: process.env.REDIS_PASSWORD,
        prefix: 'ThreadPuller:',
        db: process.env.REDIS_DB,
    },
).redis;

const app = express();
const Router = (require('./lib/Router/API/v1'))(redis);

Raven.config(process.env.SENTRY_DSN_URL).install();

app.get('/', (req, res) => {
    return res.redirect('v1/');
});

app.get('/favicon.ico', (req, res) => res.sendFile(path.resolve('./public/favicon.ico')));

app.use('/v1/', Router);

SimpleLogger.info('API starting...');

if (!redis)
    SimpleLogger.info('API starting without redis...');

http.createServer(app)
    .listen(process.env.API_PORT, () => {
        SimpleLogger.info('API started on port', process.env.API_PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
