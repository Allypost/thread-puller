const http = require('http');
const util = require('util');
const path = require('path');
const Router = require('router');
const finalhandler = require('finalhandler');
const request = require('request-promise');

const SimpleLogger = require('./lib/Logging/SimpleLogger');
const ResourceDownloader = new (require('./lib/Resources/ResourceDownloader'))(path.resolve(process.cwd(), 'threadpuller-downloads'), SimpleLogger);

const PORT = 8135;
let API_INFO = {};

const router = new Router();

router.use((req, res, next) => {
    const { origin } = req.headers;

    const allowedDomains = [ 'thread-puller.ga', 'localhost' ];

    if (!allowedDomains.find((d) => RegExp(`http(s)?\:\/\/(${d})$`).test(origin)))
        return res.status(401).send('Invalid domain');

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');

    return next();
});

router.get('/:board/:thread', async (req, res) => {
    const { board, thread } = req.params;

    const opts = {
        uri: util.format(API_INFO.thread_link, board, thread),
        json: true,
    };

    const data = await request(opts);
    const download = await ResourceDownloader.download(data, { board, thread });

    return res.end(JSON.stringify({ board, thread, download }));
});

router.get('/ping', (req, res) => res.end('pong'));

(async () => {
    console.clear();
    SimpleLogger.info('Fetching API info...');
    API_INFO = await request({ uri: 'https://api.thread-puller.ga', json: true });
    SimpleLogger.moveUpLines();

    http.createServer((req, res) => router(req, res, finalhandler(req, res)))
        .listen(PORT, () => {
            SimpleLogger.info('Downloader started on port', PORT);
        })
        .on('error', err => {
            console.warn(err);
        });
})();
