const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const readFile = util.promisify(fs.readFile);

function generateHash(content, algo = 'sha384') {
    const hash = (
        crypto
            .createHash(algo)
            .update(content, 'utf8')
            .digest('base64')
    );

    return `${algo}-${hash}`;
}

module.exports = class HashedFile {

    constructor(path = '', uri = '') {
        this.path = path;
        this.uri = uri;
        this._contents = '';
        this._sri = '';
        this._storeContents = false;
    }

    static async create(filePath = '', uri = '') {
        const file = new HashedFile(filePath, uri);

        return await file.regenerateContents();
    }

    static async withStoredContents(filePath = '', uri = '') {
        const file = new HashedFile(filePath, uri);

        return await file.storeContents(true).regenerateContents();
    }

    storeContents(doStore = true) {
        this._storeContents = doStore;

        return this;
    }

    get contents() {
        return this._contents;
    }

    set contents(newContents) {
        this._sri = generateHash(newContents);

        if (this._storeContents)
            this._contents = newContents;

        return newContents;
    }

    get sri() {
        return this._sri;
    }

    async regenerateContents() {
        if (!this.path)
            throw new ReferenceError('No file path');

        try {
            this.contents = await readFile(this.path, 'utf8');
        } catch (e) {
            this.contents = '';
        }

        return this;
    }

    watch(cb = async () => 1) {
        if (!this.path)
            throw new ReferenceError('No file path');

        fs.watch(this.path, async (type) => {
            if (type === 'rename')
                return;

            const contents = await this.regenerateContents().catch(console.error);
            await cb(contents);
        });

        return this;
    }

    toString() {
        if (this._storeContents)
            return this.contents;
        else
            return this.path;
    }

};
