const HashedFile = require('../HashedFile');

module.exports = class JsonFile extends HashedFile {
    constructor(path = '', uri = '') {
        super(path, uri);
        this._jsonContents = {};
    }

    static async fromPath(filePath) {
        const file = new JsonFile(filePath);

        return await file.regenerateContents();
    }

    set contents(newContents) {
        super.contents = newContents;

        if (newContents)
            this._jsonContents = JSON.parse(newContents);
        else
            this._jsonContents = {};

        return this._jsonContents;
    }

    get contents() {
        return this._jsonContents;
    }
};
