import {
  mutationSet,
} from './helpers/entryCRUD';

export const state = () => (
  {
    entries: [],
  }
);

export const getters = {
  get({ entries }) {
    return entries;
  },

  getOne({ entries }) {
    return (boardName) => entries.find((board) => board.board === boardName);
  },
};

export const mutations = {
  ...mutationSet({ identifierKey: 'board' }),
};

export const actions = {

  async fetchOne(
    {
      state,
      commit,
    },
    { boardName },
  ) {
    const board = await this.$api.$get(`board/${ boardName }`);

    if (!board) {
      return;
    }

    commit('add', board);

    return state.entries.find((b) => b.name === board.name);
  },

  async fetch(
    {
      state,
      commit,
    },
  ) {
    const boards = await this.$api.$get('/boards');

    if (!boards) {
      return;
    }

    commit('set', boards);

    return state.entries;
  },

};
