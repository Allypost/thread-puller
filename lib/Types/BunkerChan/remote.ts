import {
  LiteralUnion,
} from 'type-fest';

type Bool = 0 | 1;

/* eslint-disable camelcase */

export type BunkerChanBoard = {
  code: string;
  name: string;
  sfw: boolean;
  posting_enabled: boolean;
};

export type BunkerChanBoardIndex = {
  captcha: boolean;
  flags: Record<string, string>;
  boards: BunkerChanBoard[];
};

export type BunkerChanPostFile = {
  id: string;
  mime: string;
  ext: string;
  h?: number;
  w?: number;
  fsize: number;
  filename: string;
  spoiler?: boolean;
  md5: string;
  file_path: string;
  thumb_path: string;
};

export type BunkerChanPostBase = {
  no: number;
  sub?: string;
  com?: string;
  email?: string;
  name: LiteralUnion<'Anonymous', string>;
  time: number;
  sticky: Bool;
  locked: Bool;
  cyclical: '0' | '1';
  last_modified: number;
  capcode?: LiteralUnion<'Mod', string>;
  board: string;
  resto: number;
  files?: BunkerChanPostFile[];
};

export type BunkerChanPostOp = {
  com: string;
  omitted_posts: number;
  omitted_images: number;
  replies: number;
  images: number;
  unique_ips: number;
  warning_msg?: string;
} & BunkerChanPostBase;

type BunkerChanPostOptionalCountryFlags = {
  country: LiteralUnion<'XX', string>;
  country_name: string;
} & BunkerChanPostBase;

type BunkerChanPostOptionalBoardFlags = {
  board_flag: string;
  flag_name: string;
} & BunkerChanPostBase;

/* eslint-enable camelcase */

type BunkerChanPostOptional =
  BunkerChanPostOptionalCountryFlags
  & BunkerChanPostOptionalBoardFlags
  ;

export type BunkerChanPost =
  (
    BunkerChanPostBase
    | BunkerChanPostOp
    )
  & Partial<BunkerChanPostOptional>
  ;

type BunkerChanBoardCatalogEntry = {
  threads: BunkerChanPostOp[];
  page: number;
};

export type BunkerChanBoardCatalog = BunkerChanBoardCatalogEntry[];

export type BunkerChanThreadCatalog = {
  posts: BunkerChanPost[];
};
