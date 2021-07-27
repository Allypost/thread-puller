export type Board = {
  title: string;
  board: string;
  link: string;
  description: string;
  nsfw: boolean;
};

export type AttachmentBase = {
  id: string;
  postId: number;
  name: string;
  board: string;
  filename: string;
  extension: string;

  dimensions: {
    main: {
      width: number;
      height: number;
    };
  };

  size: number;
  md5: string;
};

export type AttachmentMeta = {
  meta: {
    isVideo: boolean;
    isImage: boolean;
  };

  src: {
    local: {
      full: string;
      thumb: string;
    };
    remote: {
      full: string;
      thumb: string;
    };
  };
};

export type Attachment = AttachmentBase & AttachmentMeta;

export type Post = {
  id: number;
  board: string;
  thread: number;
  posted: Date;

  body: {
    title: string;
    poster: string;
    content: string;
  };

  meta: {
    replies: number | number[];
    images: number;
    videos: number;
    media: number;
    mentions?: number[];
  };

  files: Attachment[];
};
