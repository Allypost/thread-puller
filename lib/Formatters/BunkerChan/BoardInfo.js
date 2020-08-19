import {
  AllHtmlEntities as HtmlEntities,
} from 'html-entities';

const htmlEntities = new HtmlEntities();

export default class BoardInfo {
  static parse(board) {
    // noinspection JSUnresolvedVariable
    return {
      title: htmlEntities.decode(board.boardName),
      board: board.boardUri,
      link: `/${ board.boardUri }/`,
      description: htmlEntities.decode(board.boardDescription),
      nsfw: !board.specialSettings || !board.specialSettings.includes('sfw'),
    };
  }
}
