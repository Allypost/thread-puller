const HashedFile = require('../HashedFile');

module.exports = class AssetFile extends HashedFile {
    constructor(filePath, uri) {
        if (!filePath || !uri)
            throw new Error('File path and uri are required');

        super(filePath, uri);
    }

    withAttributes(attributes) {
        if (!this._attributes)
            this._attributes = {};

        Object.assign(this._attributes, attributes);

        return this;
    }

    getAttributes() {
        return (
            Object
                .entries(this._attributes)
                .map(([ name, value ]) => `${name}="${value.replace(/"/g, `\\"`)}"`)
                .join(' ')
        );
    }
};
