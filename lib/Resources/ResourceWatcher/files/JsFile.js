const AssetFile = require('./AssetFile');

module.exports = class JsFile extends AssetFile {
    constructor(...props) {
        super(...props);
    }

    static async create(filePath, uri) {
        const file = new JsFile(filePath, uri);

        return await file.regenerateContents();
    }

    toString() {
        const attributes = {
            src: this.uri,
            integrity: this.sri,
            crossorigin: 'anonymous',
        };

        return `<script ${this.withAttributes(attributes).getAttributes()}></script>`;
    }
};
