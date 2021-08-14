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
    return (threadId) => entries.find((thread) => String(thread.id) === String(threadId));
  },
};

export const mutations = {
  ...mutationSet(),
};

export const actions = {

  async fetchOne(
    {
      state,
      commit,
    },
    {
      boardName,
      threadId,
    },
  ) {
    const threads = await this.$api.$get(`/boards/${ boardName }/thread/${ threadId }`);

    if (!threads) {
      return;
    }

    commit('set', threads);

    return state.entries.find((stateThread) => String(stateThread.id) === String(threads.id));
  },

  async fetch(
    {
      state,
      commit,
    },
    { boardName },
  ) {
    const threads = await this.$api.$get(`/boards/${ boardName }/threads`);

    if (!threads) {
      return;
    }

    commit('set', threads);

    return state.entries;
  },

};
