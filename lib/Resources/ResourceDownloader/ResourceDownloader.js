const fs = require('fs');
const request = require('request');
const path = require('path');
const mkdirp = require('mkdirp');
let SimpleLogger = require('../../Logging/SimpleLogger');

function toHHMMSS(secs) {
    const s = Math.round(secs);
    const hours = Math.floor(s / 3600) % 24;
    const minutes = Math.floor(s / 60) % 60;
    const seconds = s % 60;
    const timeNames = [ 'h', 'm', 's' ];

    return [ hours, minutes, seconds ]
               .map((v, i) => `${v}${timeNames[ i ]}`)
               .filter(t => t.substr(0, 1) !== '0')
               .join(' ') || '0s';
}

class ResourceDownloader {

    constructor(basePath, logger = null) {
        this.basePath = basePath;

        if (logger)
            SimpleLogger = logger;
    }

    async download(downloadList = [], info = null) {
        if (!Array.isArray(downloadList))
            return null;

        const files =
                  downloadList
                      .filter((post) => post.file)
                      .map(({ id, board, thread, file }) => ({ id, board, thread, file: { url: file.meta.fullSrc, name: file.filename } }));

        let downloadedFiles = 0;

        const tick = () => {
            downloadedFiles += 1;
            const numLen = String(files.length).length;

            SimpleLogger.moveUpLines();
            SimpleLogger.info(`Downloaded ${String(downloadedFiles).padStart(numLen, ' ')}/${files.length}`);
        };

        const filePromises = files.map(this._download.bind(this, tick));

        SimpleLogger.info('Downloading files...');

        const startTime = Date.now();
        const filePaths = await Promise.all(filePromises);
        const downloadTime = toHHMMSS((Date.now() - startTime) / 1000);

        SimpleLogger.moveUpLines();
        if (info)
            SimpleLogger.info(`Downloaded everything from ${info.board}/${info.thread} in ${downloadTime}`);
        else
            SimpleLogger.info(`Downloaded everything in ${downloadTime}`);

        return filePaths;
    }

    async _download(tick, { id, board, thread = 'BASE', file }) {
        const basePath = this.basePath;

        const downloadPath = path.resolve(basePath, String(board), String(thread));
        const downloadDir = await this._makeDir(downloadPath);

        const filePath = path.resolve(downloadDir, file.name);
        const success = await this._downloadFile(file.url, filePath);

        tick({ id, board, thread, file, filePath, success });

        return filePath;
    }

    async _downloadFile(url, path) {
        return new Promise((resolve) => {
            const opts = {
                uri: url,
                headers: {
                    'User-Agent': 'ThreadPuller downloader',
                },
            };

            request(opts)
                .on('error', () => resolve(true))
                .on('response', () => resolve(path))
                .pipe(fs.createWriteStream(path));
        });
    }

    async _makeDir(dirname) {
        return new Promise((resolve, reject) => {
            mkdirp(dirname, (err) => {
                if (err)
                    return reject(err);

                resolve(dirname);
            });
        });
    }

}

module.exports = ResourceDownloader;
