import {
  SetRequired,
} from 'type-fest';
import type {
  Post as LegacyPost,
} from '../../Types/4chan/local';
import type {
  FourChanPost,
} from '../../Types/4chan/remote';
import {
  Post,
} from '../../Types/api';
import FileInfo from './FileInfo';

export default class PostInfo {
  public static toOld(post: Post): LegacyPost {
    const {
      files: [ file = null ],
      ...restPost
    } = post;

    const legacyPost: LegacyPost = {
      ...restPost,
      file: null,
    };

    if (Array.isArray(post.meta.refs?.repliesTo)) {
      legacyPost.meta.replies = post.meta.refs?.mentionedIn as Array<number>;
      legacyPost.meta.mentions = post.meta.refs?.repliesTo as Array<number>;
    }

    if (file) {
      legacyPost.file = {
        ...file,
        id: Number(file.id),
        dimensions: file.dimensions as SetRequired<typeof file.dimensions, 'thumbnail'>,
        src: {
          ...file.src,
          local: {
            ...file.src.local,
            thumbHD: file.src.local.thumb,
          },
        },
      };

      delete (legacyPost.file?.meta as any).isImage;
    }

    delete (legacyPost.meta as any).refs;
    delete (legacyPost.meta as any).videos;
    delete (legacyPost.meta as any).media;

    return legacyPost;
  }

  public static parse(board: string, post: FourChanPost): Post {
    return {
      id: +post.no,
      board,
      thread: post.resto || post.no,
      posted: new Date(post.time * 1000),
      body: {
        title: post.sub || '',
        poster: post.name || '',
        content: (post.com || '').replace(/<wbr>/gi, ''),
      },
      meta: {
        replies: post.replies || 0,
        images: post.images || 0,
        videos: post.images || 0,
        media: post.images || 0,
      },
      files: FileInfo.parse(post, board),
    };
  }

  public static addMetas(posts: Post[]): Post[] {
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
    const matches = post.body.content.match(/#p([0-9]+)/g);

    if (null === matches) {
      return [];
    }

    return matches.map((m) => Number(m.substring(2)));
  }
}
