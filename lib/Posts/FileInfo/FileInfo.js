class FileInfo {

    static parse(post, board) {
        // noinspection JSUnresolvedVariable
        if (!post.tim)
            return null;

        // noinspection JSUnresolvedVariable
        const file = {
            id: +post.tim,
            name: post.filename,
            board: board,
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

        return FileInfo.addMeta(file);
    }

    static addMeta(file) {
        const meta = {
            isVideo: FileInfo.isVideo(file.extension),
            thumbSrc: FileInfo.thumbSrc(file),
            fullSrc: FileInfo.fullSrc(file),
        };

        return Object.assign({}, file, { meta });
    }

    static isVideo(extension) {
        return Number(FileInfo.getFileType(extension) === 'video');
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

    static thumbSrc({ board, id }) {
        const filename = `${id}s.jpg`;

        return FileInfo.cacheUrl({ board, filename });
    }

    static fullSrc({ board, filename, extension }) {
        if (FileInfo.isVideo(extension))
            return `https://i.4cdn.org/${board}/${filename}`;
        else
            return FileInfo.cacheUrl({ board, filename });
    }

    static cacheUrl({ board, filename }) {
        return `${process.env.THREADPULLER_DOMAIN_CACHE}/i/${board}/${filename}`;
    }
}

module.exports = FileInfo;
