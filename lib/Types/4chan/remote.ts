/* eslint-disable camelcase */

import {
  LiteralUnion,
} from 'type-fest';

type Bool = 0 | 1;

// https://github.com/4chan/4chan-API/blob/master/pages/Boards.md
type FourChanBoardBase = {
  board: string;
  title: string;
  ws_board: 0 | 1; // Worksafe board?
  per_page: number;
  pages: number;
  max_filesize: number;
  max_webm_filesize: number;
  max_comment_chars: number;
  max_webm_duration: number;
  bump_limit: number;
  image_limit: number;
  cooldowns: {
    threads: number;
    images: number;
    replies: number;
  };
  meta_description: string;
};

type FourChanBoardOptional = {
  spoilers: Bool;
  custom_spoilers: Bool;
  is_archived: Bool;
  board_flags: undefined;
  country_flags: 0;
  user_ids: Bool;
  oekaki: Bool;
  sjis_tags: Bool;
  code_tags: Bool;
  math_tags: Bool;
  text_only: Bool;
  forced_anon: Bool;
  webm_audio: Bool;
  require_subject: Bool;
  min_image_width: number;
  min_image_height: number;
};

export type FourChanBoard =
  FourChanBoardBase
  & Partial<FourChanBoardOptional>
  ;

export type FourChanResponse = {
  boards: FourChanBoard[];
};

// https://github.com/4chan/4chan-API/blob/master/pages/Threads.md
type FourChanPostBase = {
  no: number;
  now: string;
  name: LiteralUnion<'Anonymous', string>;
  time: number;
  resto: 0 | number;
  trip?: string;
  id?: string;
  capcode?: 'mod' | 'admin' | 'admin_highlight' | 'manager' | 'developer' | 'founder';
  since4pass?: number;
};

export type FourChanPostWithCountryFlags = {
  country: 'XX' | string;
  country_name: string;
} & FourChanPostBase;

export type FourChanPostWithBoardFlags = {
  board_flag: string;
  flag_name: string;
} & FourChanPostBase;

export type FourChanPostWithAttachment = {
  tim: number;
  filename: string;
  ext: string;
  fsize: number;
  md5: string;
  w: number;
  h: number;
  tn_w: number;
  tn_h: number;
  filedeleted?: 1;
  spoiler?: 1;
  custom_spoiler?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  m_img?: 1;
} & FourChanPostBase;

type FourChanPostOptional =
  FourChanPostWithCountryFlags
  & FourChanPostWithBoardFlags
  & FourChanPostWithAttachment
  ;

type FourChanPostIsOp = {
  sticky?: 1;
  closed?: 1;
  sub?: string;
  com?: string;
  omitted_posts?: number;
  omitted_images?: number;
  replies: number;
  images: number;
  bumplimit?: 1;
  imagelimit?: 1;
  last_modified: number;
  tag: string;
  semantic_url: string;
} & FourChanPostBase;

export type FourChanPost =
  FourChanPostBase
  & Partial<FourChanPostIsOp>
  & Partial<FourChanPostOptional>
  ;

// https://github.com/4chan/4chan-API/blob/master/pages/Catalog.md
export type FourChanCatalogEntry = {
  page: number;
  threads: FourChanPost[];
};

export type FourChanCatalog = FourChanCatalogEntry[];

export type FourChanThread = {
  posts: FourChanPost[];
};
