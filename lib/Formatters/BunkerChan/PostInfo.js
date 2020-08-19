import FileInfo from './FileInfo';

export default class PostInfo {

  static parse(board, thread, post) {
    const files = FileInfo.parseFiles(post.files);

    // noinspection JSUnresolvedVariable
    const data = {
      id: Number(post.postId || thread),
      board,
      thread,
      posted: new Date(post.creation),

      body: {
        title: post.subject || '',
        poster: '',
        content: post.message,
        parsedContent: post.markup,
      },

      meta: {
        replies: 0,
        images: files.filter((file) => file.meta.isImage || file.meta.isVideo).length,
      },
    };

    if (1 < files.length) {
      data.files = files;
    } else {
      const [ file ] = files;

      data.file = file;
    }

    return data;
  }

  static addMetas(posts) {
    if (!Array.isArray(posts)) {
      return posts;
    }

    return posts.map((post) => this.addMeta(posts, post));
  }

  static addMeta(posts, post) {
    Object.assign(post, this.addRepliesToPost(posts, post));
    Object.assign(post, this.addMentionsInPost(post));

    return post;
  }

  static addRepliesToPost(posts, post) {
    post.meta.replyList = this.getReplies(posts, post);
    post.meta.replies = post.meta.replies || post.meta.replyList.length;

    return post;
  }

  static getReplies(posts, post) {
    return (
      posts
        .filter((p) => String(p.body.content || '').includes(`>>${ post.id }`))
        .map((p) => p.id)
    );
  }

  static addMentionsInPost(post) {
    post.meta.mentionsList = this.getMentions(post);

    return post;
  }

  static getMentions(post) {
    const re = /(^|[^>])>>([0-9]+)/g;
    const { content } = post.body;
    const matches = content.match(re) || [];

    return matches.map((m) => Number(m.replace(/[^\d]/gi, '')));
  }

}
