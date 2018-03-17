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
const Entities = new (require('html-entities').AllHtmlEntities);

bluebird.promisifyAll(redisCLI.RedisClient.prototype);
bluebird.promisifyAll(redisCLI.Multi.prototype);

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redis = !+process.env.THREADPULLER_IGNORE_REDIS_CACHE
    ? redisCLI.createClient({
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
                            })
    : null;

const htmlentities = Entities.encode;

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
    {
        link: `/css/index.min.css`,
    },
];

const scripts = [
    {
        link: `/js/Board.min.js`,
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

const getResourceWatcher = (resourceList) => {
    return async resource => {
        if (!resource.file)
            resource.file = path.join(__dirname, 'public/', resource.link);
        if (!resource.algo)
            resource.algo = 'sha256';

        addResourceWatcher(resource, resourceList);
        Object.assign(resource, await updateResource(resource));
    };
};

styles.forEach(getResourceWatcher(styles));
scripts.forEach(getResourceWatcher(scripts));

const getLiveBoards = async () => new Promise(resolve => {
    const options = {
        'host': 'a.4cdn.org',
        'path': `/boards.json`,
        'method': 'GET',
        'headers': {
            'Referer': `https://4chan.org/`,
            'User-Agent': 'ThreadPuller',
        },
    };

    http
        .request(options, res => {
            if (res.statusCode !== 200)
                return resolve(null);

            let body = '';
            // noinspection JSUnresolvedFunction
            res.setEncoding('utf8')
               .on('data', (chunk) => body += chunk)
               .on('end', () => {
                   try {
                       resolve(JSON.parse(body));
                   } catch (e) {
                       resolve(null);
                   }
               });
        })
        .on('error', e => {
            Raven.captureException(e);

            resolve(null);
        })
        .end();
});
const getCachedBoards = async () => {
    const cacheKey = `boards`;

    if (redis)
        try {
            return JSON.parse(await redis.getAsync(cacheKey));
        } catch (e) {
            info(`Cache corruption in \`${cacheKey}\`! Purging...`);

            redis.delAsync(cacheKey);
        }

    return await getLiveBoards();
};
const setCachedBoards = (boards) => {
    if (!boards)
        return null;

    if (redis && boards.length)
        redis.setAsync(`boards`, JSON.stringify(boards), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

    return boards;
};
const getBoards = async () => {
    const cachedBoards = await getCachedBoards();

    if (
        cachedBoards
        && !!cachedBoards.length
    )
        return cachedBoards;

    return setCachedBoards(await getLiveBoards());
};

const getLiveThreads = async (board) => new Promise(resolve => {
    const options = {
        'host': 'a.4cdn.org',
        'path': `/${board}/catalog.json`,
        'method': 'GET',
        'headers': {
            'Referer': `https://boards.4chan.org/${board}/`,
            'User-Agent': 'ThreadPuller',
        },
    };

    http
        .request(options, res => {
            if (res.statusCode !== 200)
                return resolve(null);

            let body = '';
            // noinspection JSUnresolvedFunction
            res.setEncoding('utf8')
               .on('data', (chunk) => body += chunk)
               .on('end', () => {
                   try {
                       resolve(JSON.parse(body));
                   } catch (e) {
                       resolve(null);
                   }
               });
        })
        .on('error', e => {
            Raven.captureException(e);

            resolve(null);
        })
        .end();
});
const getCachedThreads = async (board) => {
    const cacheKey = `${board}`;

    if (redis)
        try {
            return JSON.parse(await redis.getAsync(cacheKey));
        } catch (e) {
            info(`Cache corruption in \`${cacheKey}\`! Purging...`);

            redis.delAsync(cacheKey);
        }

    return await getLiveThreads(board);
};
const setCachedThreads = (board, threads) => {
    if (!threads)
        return null;

    if (redis && threads.length)
        redis.setAsync(`${board}`, JSON.stringify(threads), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

    return threads;
};
const getThreads = async (board) => {
    const cachedThreads = await getCachedThreads(board);

    if (
        cachedThreads
        && !!cachedThreads.length
    )
        return cachedThreads;

    return setCachedThreads(board, await getLiveThreads(board));
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
const getCachedPosts = async (board, thread) => {
    const cacheKey = `${board}:${thread}`;

    if (redis)
        try {
            return JSON.parse(await redis.getAsync(cacheKey));
        } catch (e) {
            info(`Cache corruption in \`${cacheKey}\`! Purging...`);

            redis.delAsync(cacheKey);
        }

    return await getLivePosts(board, thread);
};
const setCachedPosts = (board, thread, posts) => {
    if (!posts)
        return null;

    const filteredPosts = posts.filter(post => post.file);

    if (redis && filteredPosts.length)
        redis.setAsync(`${board}:${thread}`, JSON.stringify(filteredPosts), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

    return filteredPosts;
};
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
        thread: post.resto || post.no,
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
    const volume = opts.volume / 100;

    // noinspection JSUnusedGlobalSymbols
    return `<video controls ${autoplay + loop} onloadstart="this.volume=${volume}" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (post) => {
    const mainURL = getImageLocalUrl(post.board, post.file.filename);
    const altUrl = getImageLocalThumbUrl(post.board, post.file.id);

    const height = post.file.dimensions.main.height;
    const width = post.file.dimensions.main.width;

    const ratio = height && width ? height / width : 0;

    const load = ratio !== 0 ? `onloadstart="this.setAttribute('height', this.offsetWidth * ${ratio} + 'px');"` : '';

    //  onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"
    return `<img src="${altUrl}" data-master-src="${mainURL}" ${load} onload="if(this.src !== this.dataset.masterSrc) { this.src = this.dataset.masterSrc }">`;
};
const a = (url, name, newTab) => {
    const newT = newTab ? `target="_blank"` : '';

    return `<a href="${url}" class="resource" ${newT}>${name}</a>`;
};
const title = (post) => `<title>/${post.board}/ - ${post.body.title || post.body.content.substr(0, 150) || 'No title'}</title>`;
const meta = () => `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><meta name="theme-color" content="#1E1E1E"><meta name="application-name" content="ThreadPuller - View 4chan thread images and videos"><meta name="msapplication-TileColor" content="#1E1E1E">`;
const header = (thread, num) => `<h1><a href="/${thread}/">Back</a> | <a href="${getThreadUrl(thread, num)}" target="_blank">Go to thread</a></h1>`;

const getFileType = (extension) => {
    switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'image';
        default:
            return 'video';
    }
};

const resource = (post, params) => {
    const postUrl = getPostUrl(post.board, post.thread, post.id);

    // noinspection PointlessBooleanExpressionJS
    const opts = {
        autoplay: !!params.autoplay,
        loop: typeof params.loop !== typeof undefined
              && params.loop !== 'false'
              && params.loop !== 'no'
              && +params.loop !== 0,
        volume: typeof params.volume !== typeof undefined
            ? +params.volume
            : 50,
    };


    const res = getFileType(post.file.extension) === 'image'
        ? img
        : vid;

    return a(postUrl, res(post, opts), true);
};

const getThreadUri = (board, thread) => `${board}/thread/${thread}`;
const getApiUrl = (board, thread) => `https://a.4cdn.org/${getThreadUri(board, thread)}.json`;
const getThreadUrl = (board, thread) => `https://boards.4chan.org/${getThreadUri(board, thread)}`;
const getPostUrl = (board, thread, postNum) => `${getThreadUrl(board, thread)}#p${postNum}`;
const getFileUrl = (board, filename) => `https://i.4cdn.org/${board}/${filename}`;
const getImageLocalUrl = (board, filename) => `${process.env.THREADPULLER_DOMAIN_CACHE}/i/${board}/${filename}`;
const getImageLocalThumbUrl = (board, resourceID) => getImageLocalUrl(board, resourceID + 's.jpg');
const getImageThumbUrl = (board, resourceID) => getFileUrl(board, resourceID + 's.jpg');

Router.use('/', express.static(path.join(__dirname, 'public')));

Router.get('/', async (req, res) => {
    res.type('html');
    res.write(meta());

    const boards = (await getBoards())
        .boards
        .map(board => ({
            title: board.title,
            board: board.board,
            link: `/${board.board}/`,
            description: board.meta_description,
            nsfw: !board.ws_board,
        }));

    const links = boards.map(
        ({ title: title, board: board, link: link, description: description, nsfw: nsfw }) => `
            <article class="board" ${nsfw ? 'data-nsfw="1"' : ''}>
                <header>
                    <h1 class="title"><a href="${link}">/${board}/ - ${title}</a></h1>
                </header>
                <section class="description">${description}</section>
            </article>`.trim().replace(/\s+/g, ' ').replace(/> </, '><')//
    );

    res.write('<title>ThreadPuller</title>');

    styles.filter((_, i) => i < 2).forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));

    res.write(links.join(''));

    res.end();
});

Router.get('/:board/', async (req, res) => {
    const board = htmlentities(req.params.board);
    const rawBoardPosts = await getThreads(board);

    res.type('html');
    res.write(meta());

    styles.forEach(({ link: src, tag: v }) => res.write(`<link rel="stylesheet" href="${src}?v=${v}">`));
    scripts.forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

    if (!rawBoardPosts) {
        res.write(`<title>/404/ - Board Not Found</title>`);
        res.write(`<h1><a href="/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank">Go to board</a></h1>`);
        res.write(`<h1>Can't find the board \`${board}\`</h1>`);
        return res.end();
    }

    res.write(`<title>/${board}/ - ThreadPuller</title>`);

    res.write(`<h1><a href="/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank">Go to board</a></h1>`);

    [].concat(
        ...rawBoardPosts.map(page => page.threads)
                        .map(threads => threads.filter(thread => thread.images))
                        .map(threads => normalizePosts(board, threads))//
    ).forEach(
        post =>
            res.write(
                `<article class="board">
                     <header ${!post.body.title ? 'data-missing-title="1"' : ''}>
                        <h1 class="title"><a href="${`/${board}/thread/${post.thread}`}">${post.body.title || '<i>No title</i>'}</a></h1>
                     </header>
                     <section class="content ${!post.body.content ? 'no-content' : ''}">${
                    post.file
                        ? `<section class="post-image-container" data-is-video="${(getFileType(post.file.extension) === 'video') ? '1' : '0'}">
                               <img data-src-full="${getImageLocalUrl(board, post.file.filename)}" data-src-thumb="${getImageLocalThumbUrl(board, post.file.id)}" src="${getImageLocalThumbUrl(board, post.file.id)}" alt="${post.file.name}">
                           </section>`
                        : ''
                    }<section class="description">${post.body.content}</section>
                     </section>
                 </article>`.trim().replace(/\s+/g, ' ').replace(/> </, '><')//
            )//
    );

    res.write('<script>(function() { Board.init() })()</script>');

    res.end();
});

Router.get('/:board/thread/:thread', async (req, res) => {
    const p = Object.entries(req.params)
                    .map(([ key, value ]) => [ key, htmlentities(value) ])
                    .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});

    const posts = await getPosts(p.board, p.thread);

    res.type('html');
    res.write(meta());
    styles.forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));

    if (!posts) {
        res.write(title({ board: p.board, body: { title: 'Post not found...' } }));
        res.write(header(p.board, p.thread));
        res.write(`<h1>There are no posts here...<br>Please try again later</h1>`);

        return res.end();
    }

    res.write(title(posts[ 0 ]));
    res.write(header(p.board, p.thread));

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

if (!redis)
    info('Starting without redis...');

http.createServer(app)
    .listen(process.env.PORT, () => {
        info('Server started on port', process.env.PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
