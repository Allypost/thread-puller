const AssetFile = require('./AssetFile');

module.exports = class CssFile extends AssetFile {
    constructor(...props) {
        super(...props);
    }

    static async create(filePath, uri) {
        const file = new CssFile(filePath, uri);

        return await file.regenerateContents();
    }

    toString() {
        const attributes = {
            rel: 'stylesheet',
            href: this.uri,
            integrity: this.sri,
            crossorigin: 'anonymous',
        };

        return `<link ${this.withAttributes(attributes).getAttributes()}>`;
    }
};
