export default class FileInfo {

    static parse(post, board) {
        // noinspection JSUnresolvedVariable
        if (!post.tim) {
            return null;
        }

        // noinspection JSUnresolvedVariable
        const file = {
            id: +post.tim,
            postId: +post.no,
            name: post.filename,
            board,
            filename: post.tim + post.ext,
            extension: post.ext.substring(1),
            dimensions: {
                main: {
                    width: post.w,
                    height: post.h,
                },
                thumbnail: {
                    width: post.tn_w,
                    height: post.tn_h,
                },
            },
            size: post.fsize,
            md5: post.mp5,
        };

        return this.addMeta(file);
    }

    static addMeta(file) {
        const meta = {
            isVideo: this.isVideo(file.extension),
        };

        const src = {
            local: {
                full: this.fullSrc(file),
                thumb: this.thumbSrc(file),
                thumbHD: this.thumbFullSrc(file),
            },
            remote: {
                full: this.fullSrc(file, true),
                thumb: this.thumbSrc(file, true),
            },
        };

        return Object.assign({}, file, { meta, src });
    }

    static isVideo(extension) {
        return 'video' === this.getFileType(extension);
    }

    static getFileType(extension) {
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'image';
            default:
                return 'video';
        }
    }

    static thumbSrc({ board, id }, original = false) {
        if (original) {
            return this.thumbOriginalSrc({ board, id });
        } else {
            return this.cacheUrl({ board, filename: `${ id }s.jpg` });
        }
    }

    static thumbFullSrc({ board, filename, extension }) {
        if (this.isVideo(extension)) {
            return this.thumbUrl({ board, filename });
        } else {
            return this.cacheUrl({ board, filename });
        }
    }

    static thumbOriginalSrc(file) {
        const thumbFile = Object.assign({}, file, { filename: `${ file.id }s.jpg` });

        return this.fullSrc(thumbFile, true);
    }

    static fullSrc({ board, filename }, original = false) {
        if (original) {
            return `https://i.4cdn.org/${ board }/${ filename }`;
        } else {
            return this.cacheUrl({ board, filename });
        }
    }

    static cacheUrl({ board, filename }) {
        return `${ process.env.THREADPULLER_DOMAIN_CACHE }/i/${ board }/${ filename }`;
    }

    static thumbUrl({ board, filename }) {
        return `${ process.env.THREADPULLER_DOMAIN_CACHE }/thumb/${ board }/${ filename }.jpg`;
    }

}
