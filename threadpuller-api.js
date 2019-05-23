const http = require('http');
const express = require('express');
const Raven = require('raven');
const path = require('path');
const session = require('express-session');
const passport = require('./config/configured-passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

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

app.enable('trust proxy');

app.use((req, res, next) => {
    try {
        decodeURIComponent(req.path);
        next();
    } catch (e) {
        res.status(400);
        return res.json({ error: 'Invalid parameter' });
    }
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(session(require('./config/session')(redis)));
app.use(require('connect-flash')());
app.use(passport.initialize({ userProperty: 'user' }));
app.use(passport.session({}));

Raven.config(process.env.SENTRY_DSN_URL).install();

app.get('/', (req, res) => {
    return res.redirect('v1/');
});

app.get('/favicon.ico', (req, res) => res.sendFile(path.resolve('./public/favicon.ico')));

app.use('/v1/', Router);

app.get('*', (req, res) => res.json({ success: false, message: 'Unknown endpoint' }));

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
