import type {
  Post,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanPostOp,
} from '../../Types/BunkerChan/remote';
import FileInfo from './FileInfo';

export default class ThreadInfo {
  static parse(post: BunkerChanPostOp): Post {
    return {
      id: +post.no,
      board: post.board,
      thread: post.resto || post.no,
      posted: new Date(post.time * 1000),

      body: {
        title: post.sub || '',
        poster: post.name || '',
        content: (post.com || '').replace(/<wbr>/gi, ''),
      },

      meta: {
        replies: post.replies + post.omitted_posts,
        images: post.images || 0,
        videos: 0,
        media: post.images || 0,
      },

      files: FileInfo.parseFiles(post),
    };
  }
}
