const FileInfo = require('../FileInfo');

class PostInfo {

    static parse(board, post) {
        // noinspection JSUnresolvedVariable
        return {
            id: +post.no,
            board: board,
            thread: post.resto || post.no,
            posted: new Date(post.time * 1000),
            body: {
                title: post.sub,
                poster: post.name,
                content: post.com || '',
            },
            meta: {
                replies: post.replies || null,
                images: post.images || null,
            },
            file: FileInfo.parse(post, board),
        };
    }

}

module.exports = PostInfo;
