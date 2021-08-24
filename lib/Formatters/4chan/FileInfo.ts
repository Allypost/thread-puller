import type {
  FourChanPost,
  FourChanPostWithAttachment,
} from '../../Types/4chan/remote';
import {
  Attachment,
  AttachmentBase,
} from '../../Types/api';

export default class FileInfo {
  public static parse(rawPost: FourChanPost | FourChanPostWithAttachment, board: string): Attachment[] {
    if (!rawPost.md5) {
      return [];
    }

    const post = rawPost as FourChanPostWithAttachment;

    const file: AttachmentBase = {
      id: String(post.tim),
      postId: +post.no,
      name: post.filename,
      board,
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
      md5: post.md5,
    };

    return [ this.addMeta(file) ];
  }

  private static addMeta(file: AttachmentBase): Attachment {
    const meta: Attachment['meta'] = {
      isVideo: this.isVideo(file.extension),
      isImage: this.isImage(file.extension),
    };

    const src: Attachment['src'] = {
      local: {
        full: this.fullSrc(file),
        thumb: this.thumbSrc(file),
      },
      remote: {
        full: this.fullSrc(file, true),
        thumb: this.thumbSrc(file, true),
      },
    };

    return {
      ...file,
      meta,
      src,
    };
  }

  private static isVideo(extension: Attachment['extension']): boolean {
    return 'video' === this.getFileType(extension);
  }

  private static isImage(extension: Attachment['extension']): boolean {
    return 'image' === this.getFileType(extension);
  }

  private static getFileType(extension: Attachment['extension']): 'image' | 'video' {
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

  private static thumbSrc(
    {
      board,
      id,
    }: AttachmentBase,
    original = false,
  ): string {
    if (original) {
      return this.thumbOriginalSrc({
        board,
        id,
      });
    } else {
      return this.cacheUrl({
        board,
        filename: `${ id }s.jpg`,
      });
    }
  }

  private static thumbFullSrc(
    {
      board,
      filename,
      extension,
    }: Pick<AttachmentBase, 'board' | 'filename' | 'extension'>,
  ): string {
    if (this.isVideo(extension)) {
      return this.thumbUrl({
        board,
        filename,
      });
    } else {
      return this.cacheUrl({
        board,
        filename,
      });
    }
  }

  private static thumbOriginalSrc(file: Pick<AttachmentBase, 'id' | 'board'>): string {
    const thumbFile = {
      ...file,
      filename: `${ file.id }s.jpg`,
    };

    return this.fullSrc(thumbFile, true);
  }

  private static fullSrc(
    {
      board,
      filename,
    }: Pick<AttachmentBase, 'board' | 'filename'>,
    original = false,
  ): string {
    if (original) {
      return `https://i.4cdn.org/${ board }/${ filename }`;
    } else {
      return this.cacheUrl({
        board,
        filename,
      });
    }
  }

  private static cacheUrl(
    {
      board,
      filename,
    }: Pick<AttachmentBase, 'board' | 'filename'>,
  ): string {
    return `${ process.env.THREADPULLER_DOMAIN_CACHE }/i/${ board }/${ filename }`;
  }

  private static thumbUrl(
    {
      board,
      filename,
    }: Pick<AttachmentBase, 'board' | 'filename'>,
  ): string {
    return `${ process.env.THREADPULLER_DOMAIN_CACHE }/thumb/${ board }/${ filename }.jpg`;
  }
}
