type count = number;

export type Board = {
  title: string;
  board: string;
  link: string;
  description: string;
  nsfw: boolean;
};

type PostID = number;

export type AttachmentBase = {
  id: string;
  postId: PostID;
  name: string;
  board: Board['board'];
  filename: string;
  extension: string;

  dimensions: {
    main: {
      width: number;
      height: number;
    };
    thumbnail?: {
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
  id: PostID;
  board: Board['board'];
  thread: PostID;
  posted: Date;

  body: {
    title: string;
    poster: string;
    content: string;
  };

  meta: {
    replies: count;
    images: count;
    videos: count;
    media: count;
    refs?: {
      repliesTo: PostID[];
      mentionedIn: PostID[];
    };
  };

  files: Attachment[];
};
