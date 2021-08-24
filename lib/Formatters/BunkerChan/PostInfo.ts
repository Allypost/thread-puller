import type {
  BunkerChanBoardCatalog,
  BunkerChanPost,
  BunkerChanThreadCatalog,
} from '../../Types/BunkerChan/remote';
import type {
  Post,
} from '../../Types/api';
import FileInfo from './FileInfo';

export default class PostInfo {
  private static readonly MENTION_REGEX = />&gt;&gt;([0-9]+)</g;

  private static readonly MENTION_NUMBER_START = 9;

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
        content: post.com || '',
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
    const postRepliesTo = new Map<Post['id'], Array<Post['id']>>();
    const postsMentioning = new Map<Post['id'], Set<Post['id']>>();

    for (const post of posts) {
      const postId = post.id;

      // Get all post ids the current post includes
      const mentions = this.getPostIdsMentionedIn(post);

      if (0 === mentions.length) {
        continue;
      }

      postRepliesTo.set(postId, mentions);

      // Add current post to list of posts that mentioned the post ID
      for (const mentionedPostId of mentions) {
        if (!postsMentioning.has(mentionedPostId)) {
          postsMentioning.set(mentionedPostId, new Set());
        }

        postsMentioning
          .get(mentionedPostId)
          ?.add(postId)
        ;
      }
    }

    for (const post of posts) {
      post.meta.refs = {
        repliesTo: Array.from(postRepliesTo.get(post.id) || []),
        mentionedIn: Array.from(postsMentioning.get(post.id) || []),
      };
    }

    return posts;
  }

  private static getPostIdsMentionedIn(post: Post): number[] {
    const matches = post.body.content.match(this.MENTION_REGEX);

    if (null === matches) {
      return [];
    }

    const start = this.MENTION_NUMBER_START;
    const end = -1;

    return matches.map((m) => Number(m.slice(start, end)));
  }
}
