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
                title: post.sub || '',
                poster: post.name || '',
                content: post.com || '',
            },
            meta: {
                replies: post.replies || 0,
                images: post.images || 0,
            },
            file: FileInfo.parse(post, board),
        };
    }

    static addMetas(posts) {
        if (!Array.isArray(posts))
            return posts;

        const newPosts = posts.slice();

        return newPosts.map(post => this.addMeta(post, posts));
    }

    static addMeta(post, posts) {
        const newPost = Object.assign({}, post);
        Object.assign(newPost, this.addRepliesTo(post, posts));
        Object.assign(newPost, this.addMentionsTo(post, posts));

        return newPost;
    }

    static addRepliesTo(post, posts) {
        const replies = this.getReplies(post, posts);

        post.meta.replies = replies.length;
        post.meta.replies_list = replies;

        return post;
    }

    static getReplies(post, posts) {
        return (
            posts
                .filter(p =>
                            String(p.body.content || '')
                                .includes(`#p${post.id}`))
                .map(p => p.id)
        );
    }

    static addMentionsTo(post) {
        const mentions = this.getMentions(post);

        post.meta.mentions = mentions.length;
        post.meta.mentions_list = mentions;

        return post;
    }

    static getMentions(post) {
        const re = /#p([0-9]+)/g;
        const { body: { content } } = post;
        const matches = content.match(re) || [];

        return matches.map(m => Number(m.substring(2)));
    }

}

module.exports = PostInfo;
