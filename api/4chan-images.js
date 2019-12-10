//noinspection SpellCheckingInspection
import consola from 'consola';
import express from 'express';
import http from 'http';
import ffmpeg from 'fluent-ffmpeg';

const app = express();
app.disable('x-powered-by');

app.get('/i/:board/:resource.:ext', (req, res) => {
    const { ext, resource, board } = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${ board }/${ resource }.${ ext }`,
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
        .request(options, (resp) => {
            res.set(resp.headers);
            res.status(resp.statusCode);

            resp.pipe(res, { end: true });
        })
        .on('error', (e) => consola.error(e))
        .end();
});

app.get('/thumb/:board/:resource.:ext.png', (req, res) => {
    const { board, resource, ext } = req.params;

    res.type('png');

    ffmpeg()
        .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
        .frames(1)
        .output(res, { end: false })
        .outputOptions('-f image2pipe')
        .outputOptions('-vcodec png')
        .on('error', (err) => {
            consola.error(err);

            res.status(404).end();
        })
        .on('end', () => {
            res.end();
        })
        .run();
});

app.get('/thumb/:board/:resource.:ext.jpg', (req, res) => {
    const { board, resource, ext } = req.params;

    res.type('jpg');

    ffmpeg()
        .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
        .output(res, { end: false })
        .outputOptions('-f image2pipe')
        .outputOptions('-vframes 1')
        .outputOptions('-vcodec mjpeg')
        .on('error', (err) => {
            consola.error(err);

            res.status(404).end();
        })
        .on('end', () => {
            res.end();
        })
        .run();
});

module.exports = {
    path: '/files/',
    handler: app,
};
