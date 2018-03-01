const express = require('express');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const Raven = require('raven');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const bluebird = require('bluebird');
const redisCLI = require('redis');

bluebird.promisifyAll(redisCLI.RedisClient.prototype);
bluebird.promisifyAll(redisCLI.Multi.prototype);

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redis = redisCLI.createClient({
                                        password: process.env.REDIS_PASSWORD,
                                        prefix: 'ThreadPuller:',
                                        db: process.env.REDIS_DB,
                                        retry_strategy(options) {
                                            if (options.error && options.error.code === 'ECONNREFUSED') {
                                                // End reconnecting on a specific error and flush all commands with a individual error
                                                console.log('|> ERR', options.error);
                                                return new Error('The server refused the connection');
                                            }

                                            if (options.total_retry_time > 1000 * 60 * 60) {
                                                // End reconnecting after a specific timeout and flush all commands with a individual error
                                                const err = new Error('Retry time exhausted');
                                                console.log('|> ERR', err);

                                                return err;
                                            }

                                            if (options.attempt > 10)
                                            // End reconnecting with built in error
                                                return undefined;

                                            // reconnect after
                                            return Math.min(options.attempt * 100, 3000);
                                        },
                                    });

const app = express();
const Router = express.Router();

Router.use(helmet());

Raven.config(process.env.SENTRY_DSN_URL).install();

// Logging functions
const dater = () => (new Date).toISOString();
const info = (...arguments) => console.log.apply(this, [ dater(), '|', ...arguments ]);

const styles = [
    {
        link: `/css/style.min.css`,
    },
];

const readFile = util.promisify(fs.readFile);
const updateResource = async (file) => {
    info('|> Updating resource...\t', file.file.replace(__dirname, ''));

    const contents = await readFile(file.file, 'utf8');

    /*
     file[ 'hash' ] = crypto.createHash(file.algo)
     .update(contents)
     .digest('base64');
     */

    file[ 'tag' ] = crypto.createHash('md5')
                          .update(contents)
                          .digest('hex');

    info('|> Updated resource\t', file.file.replace(__dirname, ''));

    return file;
};
const addResourceWatcher = (file, resourceList) => {
    const listener = async (curr, prev) => {
        const i = resourceList.findIndex(res => res.file === file.file);

        Object.assign(resourceList[ i ], await updateResource(file));
    };

    fs.watchFile(file.file, listener);
};

styles.forEach(async style => {
    if (!style.file)
        style.file = path.join(__dirname, 'public/', style.link);
    if (!style.algo)
        style.algo = 'sha256';

    addResourceWatcher(style, styles);
    Object.assign(style, await updateResource(style));
});

const getCachedPosts = async (board, thread) => {
    const cacheKey = `${board}:${thread}`;

    try {
        return JSON.parse(await redis.getAsync(cacheKey));
    } catch (e) {
        info(`Cache corruption in \`${cacheKey}\`! Purging...`);

        redis.delAsync(`${board}:${thread}`);

        return await getLivePosts(board, thread);
    }
};
const setCachedPosts = (board, thread, posts) => {
    const filteredPosts = posts.filter(post => post.file);

    redis.setAsync(`${board}:${thread}`, JSON.stringify(filteredPosts), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

    return filteredPosts;
};
const getLivePosts = async (board, thread) => new Promise(resolve => {
    const options = {
        'host': 'a.4cdn.org',
        'path': `/${getThreadUri(board, thread)}.json`,
        'method': 'GET',
        'headers': {
            'Referer': getApiUrl(board, thread),
            'User-Agent': process.env.USER_AGENT,
        },
    };

    const cb = resolve;

    http
        .request(options, res => {
            if (res.statusCode !== 200)
                return cb(null);

            let body = '';
            // noinspection JSUnresolvedFunction
            res.setEncoding('utf8')
               .on('data', (chunk) => body += chunk)
               .on('end', () => {
                   const data = {};

                   try {
                       Object.assign(data, JSON.parse(body));
                   } catch (err) {
                       return cb(null);
                   }

                   if (data.posts)
                       return cb(normalizePosts(board, data.posts));

                   cb(null);
               });
        })
        .on('error', e => {
            cb(null);

            Raven.captureException(e);
        })
        .end();
});
const getPosts = async (board, thread) => {
    const cachedPosts = await getCachedPosts(board, thread);

    if (
        cachedPosts
        && !!cachedPosts.length
    )
        return cachedPosts;

    return setCachedPosts(board, thread, await getLivePosts(board, thread));
};

const normalizePost = (board, post) => {
    // noinspection JSUnresolvedVariable
    const newPost = {
        id: +post.no,
        board: board,
        thread: post.resto,
        posted: new Date(post.time * 1000),
        body: {
            title: post.sub,
            poster: post.name,
            content: post.com || '',
        },
    };

    // noinspection JSUnresolvedVariable
    if (post.tim)
    // noinspection JSUnresolvedVariable
        newPost[ 'file' ] = {
            id: +post.tim,
            name: post.filename,
            filename: post.tim + post.ext,
            extension: post.ext.substring(1),
            dimensions: {
                main: {
                    width: post.w,
                    height: post.h,
                },
                thumbnail: {
                    width: post.tn_w,
                    height: post.tn_h,
                },
            },
            size: post.fsize,
            md5: post.mp5,
        };

    return newPost;
};
const normalizePosts = (board, posts) => posts.map(post => normalizePost(board, post));

const vid = (post, opts) => {
    const url = getFileUrl(post.board, post.file.filename);
    const autoplay = opts.autoplay ? ' autoplay muted="true"' : '';
    const loop = opts.loop ? ' loop' : '';

    // noinspection JSUnusedGlobalSymbols
    return `<video controls ${autoplay + loop} onloadstart="this.volume=0.5" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (post) => {
    const mainURL = getImageLocalUrl(post.board, post.file.filename);
    const altUrl = getImageThumbUrl(post.board, post.file.id);

    return `<img src="${mainURL}" onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }">`;
};
const a = (url, name, newTab) => {
    const newT = newTab ? `target="_blank"` : '';

    return `<a href="${url}" class="resource" ${newT}>${name}</a>`;
};
const title = (post) => `<title>${post.body.title || post.body.content.substr(0, 150) || 'No title'}</title>`;
const meta = () => `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><meta name="theme-color" content="#1E1E1E"><meta name="application-name" content="ThreadPuller - View 4chan thread images and videos"><meta name="msapplication-TileColor" content="#1E1E1E">`;
const header = (thread, num) => `<h1><a href="${getThreadUrl(thread, num)}" target="_blank">Go to thread</a></h1>`;

const resource = (post, params) => {
    const postUrl = getPostUrl(post.board, post.thread, post.id);

    // noinspection PointlessBooleanExpressionJS
    const autoplay = !!params.autoplay;
    const loop = typeof params.loop !== typeof undefined
                 && params.loop !== 'false'
                 && params.loop !== 'no'
                 && +params.loop !== 0;

    const opts = { autoplay, loop };

    let res = '';
    switch (post.file.extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            res = img(post);
            break;
        default:
            res = vid(post, opts);
            break;
    }

    return a(postUrl, res, true);
};

const getThreadUri = (board, thread) => `${board}/thread/${thread}`;
const getApiUrl = (board, thread) => `https://a.4cdn.org/${getThreadUri(board, thread)}.json`;
const getThreadUrl = (board, thread) => `https://boards.4chan.org/${getThreadUri(board, thread)}`;
const getPostUrl = (board, thread, postNum) => `${getThreadUrl(board, thread)}#p${postNum}`;
const getFileUrl = (board, filename) => `https://i.4cdn.org/${board}/${filename}`;
const getImageLocalUrl = (board, filename) => `https://thrdpllr.tk/i/${board}/${filename}`;
const getImageThumbUrl = (board, resourceID) => getFileUrl(board, resourceID + 's.jpg');

Router.use('/', express.static(path.join(__dirname, 'public')));

Router.get('/:board/thread/:thread', async (req, res) => {
    const p = req.params;
    const posts = await getPosts(p.board, p.thread);

    res.type('html');
    res.write(meta());
    styles.forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));

    if (!posts) {
        res.write(title({ body: { title: 'Post not found...' } }));
        res.write(`<h1>There are no posts here...<br>Please try again later</h1>`);

        return res.end();
    }

    res.write(header(p.board, p.thread));
    res.write(title(posts[ 0 ]));
    posts.forEach(post => {
        if (post.file)
            res.write(resource(post, req.query));
    });

    res.end();
});

Router.get('/i/:board/:resource.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${p.board}/${p.resource}.${p.ext}`,
        'method': 'GET',
        'headers': {
            'Referer': 'https://boards.4chan.org/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent': process.env.USER_AGENT,
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate',
        },
    };

    http
        .request(options, resp => {
            res.set(resp.headers);
            res.status(resp.statusCode);

            resp
                .on('data', chunk => res.write(chunk))
                .on('end', () => res.end());
        })
        .on('error', e => Raven.captureException(e))
        .end();
});

app.use(Router);

info('Server starting...');
http.createServer(app)
    .listen(process.env.PORT, () => {
        info('Server started on port', process.env.PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
