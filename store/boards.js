import Vue from 'vue';

export const state = () => (
  {
    boards: [],
    board: null,
  }
);

export const getters = {
  BOARDS({ boards }) {
    return boards;
  },

  BOARD({ board }) {
    return board;
  },
};

export const mutations = {
  setBoard(state, board) {
    Vue.set(state, 'board', board);
  },

  setBoards(state, boards) {
    Vue.set(state, 'boards', boards);
  },
};

export const actions = {

  async fetchOne({ state, commit }, { boardName }) {
    const url = `/4chan/info/boards/${ boardName }`;
    const { error, data } = await this.$api.$get(url);

    if (error) {
      return;
    }

    commit('setBoard', data);

    return state.board;
  },

  async fetch({ state, commit }) {
    const url = '/4chan/info/boards';
    const { error, data } = await this.$api.$get(url);

    if (error) {
      return;
    }

    commit('setBoards', data);

    return state.boards;
  },

};
