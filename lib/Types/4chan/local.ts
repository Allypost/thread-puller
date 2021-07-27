export type Board = {
  title: string;
  board: string;
  link: string;
  description: string;
  nsfw: boolean;
};

export type FileBase = {
  id: number;
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
    thumbnail: {
      width: number;
      height: number;
    };
  };
  size: number;
  md5: string;
};

export type FileMeta = {
  meta: {
    isVideo: boolean;
  };
  src: {
    local: {
      full: string;
      thumb: string;
      thumbHD: string;
    };
    remote: {
      full: string;
      thumb: string;
    };
  };
};

export type File = FileBase & FileMeta;

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
    mentions?: number[];
  };
  file: File | null;
};
