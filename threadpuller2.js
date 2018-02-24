const express = require('express');
const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const http = require('http');
const URL = require('url');
const os = require('os');

const ENV = os.hostname() === 'ally-pc' ? 'dev' : 'prod';

const PORT = process.env.PORT
             || ENV === 'dev' ? 80 : 8080;

const app = express();

const style = `<style> video, img { width: 24.3vw; padding: .15vw ; } body { margin: 0; } </style>`;

const getPosts = (url, cb) => {
    try {
        return request(
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
                    'Referer': url,
                },
                uri: url,
                method: 'GET',
            },
            (err, resp, body) => {
                if (err)
                    return cb([]);

                try {
                    const data = JSON.parse(body);

                    cb(data.posts);
                } catch (err) {
                    console.log('GET-POSTS', 'ERROR:', err);

                    cb([ { 'sub': 'An error occured...' } ]);
                }
            },
        );
    } catch (err) {
        console.log('GET-POSTS', 'ERROR:', err);
        return new Promise(new Function);
    }
};

const dlLoc = (dir, url) => {
    const name = url.split('/').pop();

    return dir + name;
};
const fileName = (url) => {
    const file = url.split('/').pop();
    const nameArr = file.split('.');

    return nameArr[ 0 ];
};
const dl = (dir, url, cb) => {
    let id = fileName(url);

    mkdirp(dir, (err) => {
        if (err)
            return;

        let loc = dlLoc(dir, url);

        if (fs.existsSync(loc))
            return id;

        let file = fs.createWriteStream(loc);

        try {
            http
                .get(url, (response) => {
                    response.pipe(file);
                    response.on('end', function () {
                        cb(id);
                    });
                })
                .on('error', (err) => {
                    console.log('DL:HTTP', 'ERROR:', err);
                    file.end();
                    fs.unlink(loc, (err) => {
                        if (err)
                            console.log('DL:HTTP:DELETE', 'ERROR:', err);
                    });
                })
                .end();
        } catch (err) {
            console.log('DL', 'ERROR:', err);
        }

        console.log('Create: ' + loc);
    });

    return id;
};

const localURL = (url) => {
    const urlParts = URL.parse(url);
    const origPath = urlParts.pathname;

    return `/i${origPath}`;
};
const thumbURL = (url) => {
    return url.substr(0, url.lastIndexOf('.')) + 's.jpg';
};

const vid = (url, opts) => {
    const autoplay = opts.autoplay ? ' autoplay muted=\'true\'' : '';
    const loop = opts.loop ? ' loop' : '';

    return `<video controls ${autoplay + loop} onloadstart="this.volume=0.5" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (url, isLocal) => {
    const mainURL = isLocal ? url : localURL(url);
    const altUrl = thumbURL(url);

    const error = !isLocal
        ? `onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"`
        : '';

    return `<img src="${mainURL}" ${error}>`;
};
const li = (item) => {
    return `<li>${item}</li>`;
};
const a = (url, name, newTab) => {
    let newT = newTab ? `target="_blank"` : '';
    return `<a href="${url}" ${newT}>${name}</a>`;
};
const title = (post) => {
    const title = post[ 'sub' ] || post[ 'com' ] || 'No title';

    return `<title>${title}</title>`;
};

const resource = (url, params, isLocal) => {
    const imgs = [ 'jpg', 'png', 'gif', 'jpeg' ];
    const ext = url.split('/').pop().split('.').pop();
    // noinspection EqualityComparisonWithCoercionJS
    params.loop = params.loop == +params.loop ? +params.loop : params.loop;

    // noinspection PointlessBooleanExpressionJS
    const autoplay = !!params.autoplay;
    const loop = typeof params.loop !== typeof undefined
                 && params.loop !== 'false'
                 && params.loop !== 'no'
                 && +params.loop !== 0;

    const opts = { autoplay, loop };

    const isImg = imgs.indexOf(ext) >= 0;
    const res = isImg ? img(url, isLocal) : vid(url, opts);

    return a(url, res, true);
};

const getUrl = (thread) => {
    return `https://i.4cdn.org/${thread}/`;
};
const getDlDir = (thread, num) => {
    return `dl/${thread}/${num}/`;
};
const getApiUrl = (thread, num) => {
    return `https://a.4cdn.org/${thread}/thread/${num}.json`;
};

const pad = (width, string, padding) => {
    return (width <= string.length) ? string : pad(width, padding + string, padding);
};

app.get('/:thread/thread/:num', (req, res) => {
    res.type('html');

    const p = req.params;
    const url = getApiUrl(p.thread, p.num);

    getPosts(url, posts => {
        res.write(title(posts[ 0 ]));

        posts.forEach(post => {
            if (!post.tim)
                return;

            const base = getUrl(p.thread);
            const postUrl = base + post.tim + post.ext;
            const file = resource(postUrl, req.query);

            res.write(file);
        });

        res.write(style);
        res.send();
    });
});

app.get('/i/:thread/:id.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${p.thread}/${p.id}.${p.ext}`,
        'method': 'GET',
        'headers': {
            'Referer': 'https://boards.4chan.org/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate',
        },
    };

    const ireq = http.request(options, resp => {
        res.set(resp.headers);
        res.status(resp.statusCode);

        resp.on('data', chunk => {
            res.write(chunk);
        });

        resp.on('end', () => {
            res.send();
        });
    });

    ireq.on('error', e => {
        console.log('|> REQ-ERR:', e);
    });

    ireq.end();
});

app.get('/ping', (req, res) => res.send('pong'));

if (ENV === 'dev') {

    app.get('/download/:thread/thread/:num', (req, res) => {
        res.type('html');

        const p = req.params;
        const url = getApiUrl(p.thread, p.num);
        const dir = getDlDir(p.thread, p.num);

        let resp = '';

        getPosts(url, (posts) => {
            let dls = 0;

            for (let i in posts) {
                const post = posts[ i ];
                const base = getUrl(p.thread);

                if (!post.tim)
                    continue;

                const loc = dlLoc(dir, postUrl);
                let postUrl = base + post.tim + post.ext;

                if (fs.existsSync(loc)) {
                    postUrl = '/' + loc;
                } else {
                    var dlID = dl(dir, postUrl, (id) => {
                        dls = dls ^ id;

                        if (dls === 0) {
                            var msg = 'DONE';
                            var paddingLen = ('Create: ' + loc).length / 2 + msg.length / 2;
                            console.log(pad(paddingLen, msg, ' '));
                        }
                    });

                    dls = dls ^ dlID;
                }

                resp += resource(postUrl, req.query);
            }

            resp += style;

            res.send(resp);
        });
    });

    app.get('/browse/', (req, res) => {
        res.type('html');

        let resp = '<ul>';

        fs.readdir('dl/', (err, files) => {

            files.forEach(file => {
                resp += li(a(`/browse/${file}`, file));
            });

            resp += '</ul>';

            res.send(resp);
        });
    });

    app.get('/browse/:thread', (req, res) => {
        res.type('html');

        const p = req.params;

        const dir = p.thread + '/';

        let resp = '<ul>';
        resp += li(a('/browse/', '&larr; back'));

        fs.readdir(`dl/${dir}`, (err, files) => {

            files.forEach((file) => {
                let url = '/browse/' + dir + file;
                resp += li(a(url, file));
            });

            resp += '</ul>';

            res.send(resp);
        });
    });

    app.get('/browse/:thread/:id', (req, res) => {
        res.type('html');

        const p = req.params;

        const dir = `${p.thread}/${p.id}/`;
        const path = `dl/${dir}`;

        const link = a(`/browse/${p.thread}`, '&larr; back');

        let resp = `<h1>${link}</h1>`;
        fs.readdir(path, (err, files) => {

            files.forEach(file => {
                resp += resource(`/${path}${file}`, req.query, true);
            });

            resp += style;

            res.send(resp);
        });
    });

    app.use('/dl', express.static(__dirname + '/dl'));

}

http.createServer(app)
    .listen(PORT, () => {
        console.log('Running on hostname:\t', os.hostname());
        console.log('Server started on port:\t', PORT);
    })
    .on('error', err => {
        console.log('SERVER', 'ERROR:', err);
    });
