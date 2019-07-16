const fs = require('fs');
const path = require('path');

const HashedFile = require('./HashedFile');
const JsonFile = require('./files/JsonFile');
const JsFile = require('./files/JsFile');
const CssFile = require('./files/CssFile');

class ResourceWatcher {

    constructor(publicPath, entrypointsFilePath = '', manifestFilePath = '') {
        this._publicPath = publicPath;
        this._entrypointsFilePath = entrypointsFilePath;
        this._manifestFilePath = manifestFilePath;

        this._entrypoints = null;
        this._manifest = null;

        this._parsedEntrypoints = {};
        this._parsedManifest = {};
    }

    /**
     * @param {string} name
     * @return {{css: CssFile[], js: JsFile[]}}
     */
    getEntry(name) {
        return this.getEntries(name);
    }

    /**
     * @param {string} names
     * @return {{css: CssFile[], js: JsFile[]}}
     */
    getEntries(...names) {
        const ret = {
            css: {},
            js: {},
        };

        for (const name of names) {
            const { css = [], js = [] } = this._parsedEntrypoints[ name ] || {};
            css.forEach(e => {
                ret.css[ e.sri ] = e;
            });

            js.forEach(e => {
                ret.js[ e.sri ] = e;
            });
        }

        return {
            css: Object.values(ret.css),
            js: Object.values(ret.js),
        };
    }

    /**
     * @return {{css: CssFile[], js: JsFile[]}}
     */
    appendEntry(entry, name) {
        return this.appendEnties(entry, name);
    }

    /**
     * @return {{css: CssFile[], js: JsFile[]}}
     */
    appendEnties({ css = [], js = [] } = {}, ...names) {
        const entries = this.getEntries(...names);

        return {
            css: [ ...css, ...entries.css ],
            js: [ ...js, ...entries.js ],
        };
    }

    /**
     * Return file URI from the manifest file.
     * eg.
     * "static/App.js" => "/static/App.bd73e24f.js"
     *
     * @param {string} paths
     * @return {Array.<HashedFile|null>} The file URI from the manifest file
     */
    getFiles(...paths) {
        if (!this._manifest)
            throw new Error('No manifest file provided');

        return paths.map((path) => this._parsedManifest[ path ] || null);
    }

    /**
     * Return file URI from the manifest file.
     * eg.
     * "static/App.js" => "/static/App.bd73e24f.js"
     *
     * @param {string} path
     * @return {HashedFile|null}
     */
    getFile(path) {
        return this.getFiles(path).pop();
    }

    /**
     * @return {string}
     */
    getFileUri(path) {
        const file = this.getFile(path);

        if (file)
            return file.uri;
        else
            return '';
    }

    stringify({ css = [], js = [] } = {}) {
        return css.join('') + js.join('');
    }

    async watch(cb = () => 1) {
        this._entrypoints = await JsonFile.fromPath(this._entrypointsFilePath);

        await this._addWatcher(this._entrypoints, async (newEntrypoints) => {
            const { entrypoints } = newEntrypoints.contents;

            const cast = (paths, type) => {
                return Promise.all(
                    paths.map(
                        async (uri) => {
                            const casted = await type.create(
                                path.join(this._publicPath, uri),
                                uri,
                            );

                            return casted.watch();
                        },
                    ),
                );
            };

            for (const [ name, files ] of Object.entries(entrypoints)) {
                const {
                          js: jsPaths   = [],
                          css: cssPaths = [],
                      } = files;

                const js = await cast(jsPaths, JsFile);
                const css = await cast(cssPaths, CssFile);

                this._parsedEntrypoints[ name ] = { js, css };
            }

            cb('entrypoints', this._parsedEntrypoints);
        });

        if (this._manifestFilePath) {
            this._manifest = await JsonFile.fromPath(this._manifestFilePath);

            await this._addWatcher(this._manifest, async (newManifest) => {
                const entries = newManifest.contents;

                for (const [ name, uri ] of Object.entries(entries)) {
                    this._parsedManifest[ name ] = await HashedFile.withStoredContents(path.join(this._publicPath, uri), uri);
                }
            });

            cb('manifest', this._parsedManifest);
        }

        return this;
    }

    async _addWatcher(fileInstance, cb = async () => 1) {
        async function update() {
            const file = await fileInstance.regenerateContents();

            Object.assign(fileInstance, file);
            await cb(file);

            return file;
        }

        fs.watch(fileInstance.path, async (type) => {
            if (type === 'rename')
                return;

            await update();
        });

        return await update();
    }

}

module.exports = ResourceWatcher;
