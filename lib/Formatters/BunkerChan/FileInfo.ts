import type {
  Attachment,
  AttachmentBase,
  AttachmentMeta,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanPostBase,
  BunkerChanPostFile,
} from '../../Types/BunkerChan/remote';

export default class FileInfo {
  static chanBase = 'https://bunkerchan.xyz';

  static localBase = `${ process.env.THREADPULLER_DOMAIN_API }/v2/bunker-chan/files`;

  public static parseFiles(post: BunkerChanPostBase): Attachment[] {
    if (0 === (post.files?.length || 0)) {
      return [];
    }

    return (
      post
        .files
        ?.map(
          (file) =>
            this.parseFile(
              post,
              file,
            )
          ,
        )
      || []
    );
  }

  private static parseFile(post: BunkerChanPostBase, file: BunkerChanPostFile): Attachment {
    const data: AttachmentBase = {
      board: post.board,
      postId: post.no,

      id: file.id,
      name: file.filename,
      filename: file.filename,
      extension: file.ext,
      md5: file.md5,

      dimensions: {
        main: {
          width: file.w || 0,
          height: file.h || 0,
        },
      },

      size: file.fsize,
    };

    return {
      ...data,
      ...this.addMeta(file),
    };
  }

  static addMeta(file: BunkerChanPostFile): AttachmentMeta {
    const meta = {
      isVideo: this.isVideo(file),
      isImage: this.isImage(file),
    };

    const src = {
      local: {
        full: `${ this.localBase }${ file.file_path }`,
        thumb: `${ this.localBase }${ file.thumb_path }`,
      },

      remote: {
        full: `${ this.chanBase }${ file.file_path }`,
        thumb: `${ this.chanBase }${ file.thumb_path }`,
      },
    };

    return {
      meta,
      src,
    };
  }

  private static isVideo(file: BunkerChanPostFile): boolean {
    return file.mime.startsWith('video/');
  }

  private static isImage(file: BunkerChanPostFile): boolean {
    return file.mime.startsWith('image/');
  }
}
