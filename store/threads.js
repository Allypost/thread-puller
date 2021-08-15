import Vue from 'vue';

export const state = () => (
  {
    threads: [],
  }
);

export const getters = {
  threads(state) {
    return state.threads;
  },
};

export const mutations = {
  SET_THREADS(state, threads) {
    Vue.set(state, 'threads', threads);
  },
};

export const actions = {
  async fetch(
    {
      state,
      commit,
    },
    { boardName },
  ) {
    const threads = await this.$api.$get(`/boards/${ boardName }/threads`);

    commit('SET_THREADS', threads || []);

    return state.entries;
  },
};
