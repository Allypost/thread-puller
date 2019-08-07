const { parse } = require('./FileInfo');

module.exports = class PostInfo {

    static parse(board, post) {
        // noinspection JSUnresolvedVariable
        return {
            id: +post.no,
            board,
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
            file: parse(post, board),
        };
    }

    static addMetas(posts) {
        if (!Array.isArray(posts))
            return posts;

        const newPosts = posts.slice();
        const addMeta = this.addMeta.bind(this, posts);

        return newPosts.map(addMeta);
    }

    static addMeta(posts, post) {
        const newPost = Object.assign({}, post);

        Object.assign(newPost, this.addRepliesTo(posts, post));
        Object.assign(newPost, this.addMentionsTo(post));

        return newPost;
    }

    static addRepliesTo(posts, post) {
        post.meta.replies = this.getReplies(post, posts);

        return post;
    }

    static getReplies(posts, post) {
        return (
            posts
                .filter((p) => String(p.body.content || '').includes(`#p${post.id}`))
                .map((p) => p.id)
        );
    }

    static addMentionsTo(post) {
        post.meta.mentions = this.getMentions(post);

        return post;
    }

    static getMentions(post) {
        const re = /#p([0-9]+)/g;
        const { body: { content } } = post;
        const matches = content.match(re) || [];

        return matches.map((m) => Number(m.substring(2)));
    }

};
