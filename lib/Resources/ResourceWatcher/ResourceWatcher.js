const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const crypto = require('crypto');
const path = require('path');

const SimpleLogger = require('../../Logging/SimpleLogger');


class ResourceWatcher {

    constructor(defaultDir) {
        this.defaultDir = defaultDir;
    }

    watch(resourceList) {
        resourceList.forEach(this.watcher(resourceList));
    }

    watcher(resourceList) {
        return async resource => {
            if (!(resource instanceof Object))
                return;

            if (resource.href)
                return this.hrefResource(resource, resourceList);

            const defaults = {
                file: path.join(this.defaultDir, resource.link),
                algo: 'sha256',
            };

            const newResource = Object.assign({}, defaults, resource);

            Object.assign(resource, newResource);

            this.add(resource, resourceList);

            Object.assign(resource, await this.updateResource(resource));
        };
    }

    add(file, resourceList) {
        const listener = async (curr, prev) => {
            const i = resourceList.findIndex(res => res.file === file.file);

            Object.assign(resourceList[ i ], await this.updateResource(file));
        };

        fs.watchFile(file.file, listener);
    }

    getAssets(assetList, ...assetNames) {
        const assetNamesFlattened = [ ...assetNames ];

        return assetList.filter(asset => assetNamesFlattened.includes(asset.name))
                        .map(asset => ({ link: asset.link, tag: asset.tag }));
    }

    async updateResource(file) {
        SimpleLogger.info('|> Updating resource...\t', file.file.replace(this.defaultDir, ''));

        const contents = await readFile(file.file, 'utf8');

        file[ 'tag' ] = this.constructor.generateTag(contents);

        SimpleLogger.info('|> Updated resource\t', file.file.replace(this.defaultDir, ''));

        return file;
    }

    hrefResource(resource, resourceList) {
        const i = resourceList.findIndex(res => res.href === resource.href);

        Object.assign(
            resourceList[ i ],
            {
                link: resource.href,
                tag: this.constructor.generateTag(resource.href),
            },
        );
    }

    static generateTag(cyphertext) {
        return crypto.createHash('md5')
                     .update(cyphertext)
                     .digest('hex');
    }

}

module.exports = ResourceWatcher;
