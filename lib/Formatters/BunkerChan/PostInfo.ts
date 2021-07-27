import {
  pipe,
} from 'lodash/fp';
import type {
  Post,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanBoardCatalog,
  BunkerChanPost,
  BunkerChanThreadCatalog,
} from '../../Types/BunkerChan/remote';
import FileInfo from './FileInfo';

export default class PostInfo {
  public static parseThreads(catalog: BunkerChanBoardCatalog): Post[] {
    const parsed =
      catalog
        .flatMap(
          (entry) =>
            entry.threads
          ,
        )
        .map(
          (post) =>
            this.parse(post)
          ,
        )
    ;

    return this.addMetas(parsed);
  }

  public static parsePosts(catalog: BunkerChanThreadCatalog): Post[] {
    const parsed =
      catalog
        .posts
        .map(
          (post) =>
            this.parse(post)
          ,
        )
    ;

    return this.addMetas(parsed);
  }

  private static parse(post: BunkerChanPost): Post {
    const files = FileInfo.parseFiles(post);

    let images = 0;
    let videos = 0;
    let media = 0;
    for (const file of files) {
      if (file.meta.isImage) {
        images += 1;
        media += 1;
      } else if (file.meta.isVideo) {
        videos += 1;
        media += 1;
      }
    }

    return {
      id: post.no,
      board: post.board,
      thread: post.resto || post.no,
      posted: new Date(post.time * 1000),

      body: {
        title: post.sub || '',
        poster: post.name || '',
        content: (post.com || '').replace(/<wbr>/gi, ''),
      },

      meta: {
        replies: 0,
        images,
        videos,
        media,
      },

      files,
    };
  }

  private static addMetas(posts: Post[]): Post[] {
    return posts.map((post) => this.addMeta(posts, post));
  }

  private static addMeta(posts: Post[], post: Post): Post {
    return pipe(
      this.addRepliesToPost.bind(this, posts),
      this.addMentionsInPost.bind(this),
    )(post);
  }

  private static addRepliesToPost(posts: Post[], post: Post): Post {
    post.meta.replies = this.getReplies(posts, post);

    return post;
  }

  private static getReplies(posts: Post[], post: Post): number[] {
    return (
      posts
        .filter((p) => String(p.body.content || '').includes(`>>${ post.id }`))
        .map((p) => p.id)
    );
  }

  private static addMentionsInPost(post: Post): Post {
    post.meta.mentions = this.getMentions(post);

    return post;
  }

  private static getMentions(post: Post): number[] {
    const re = /(^|[^>])>>([0-9]+)/g;
    const { content } = post.body;
    const matches = content.match(re) || [];

    return matches.map((m) => Number(m.replace(/[^\d]/gi, '')));
  }
}
