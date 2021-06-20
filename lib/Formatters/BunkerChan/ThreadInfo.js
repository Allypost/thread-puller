import FileInfo from './FileInfo';

export default class ThreadInfo {
  static parse(board, post) {
    // noinspection JSUnresolvedVariable
    return {
      id: Number(post.threadId || post.postId),
      board,
      thread: post.threadId,
      posted: new Date(post.lastBump),

      body: {
        title: post.subject || '',
        poster: '',
        content: post.message,
        parsedContent: post.markup,
      },

      meta: {
        replies: post.postCount || 0,
        images: post.fileCount || 0,
      },

      file: FileInfo.parseThumb(post.thumb),
    };
  }
}
