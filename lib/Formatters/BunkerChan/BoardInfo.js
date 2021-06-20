import {
  decode,
} from 'html-entities';

export default class BoardInfo {
  static parse(board) {
    // noinspection JSUnresolvedVariable
    return {
      title: decode(board.boardName),
      board: board.boardUri,
      link: `/${ board.boardUri }/`,
      description: decode(board.boardDescription),
      nsfw: !board.specialSettings || !board.specialSettings.includes('sfw'),
    };
  }
}
