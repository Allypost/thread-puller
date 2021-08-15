import Vue from 'vue';

export const state = () => (
  {
    boards: [],
    board: null,
  }
);

export const getters = {
  boards(state) {
    return state.boards;
  },

  board(state) {
    return state.board;
  },
};

export const mutations = {
  SET_BOARDS(state, boards) {
    Vue.set(state, 'boards', boards);
  },

  SET_BOARD(state, board) {
    Vue.set(state, 'board', board);
  },
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

    commit('SET_BOARD', board);

    return state.board;
  },

  async fetchAll(
    {
      state,
      commit,
    },
  ) {
    const boards = await this.$api.$get('/boards');

    commit('SET_BOARDS', boards);

    return state.boards;
  },

};
