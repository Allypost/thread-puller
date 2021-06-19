import Vue from 'vue';

export const state = () => (
  {
    threads: [],
    thread: null,
  }
);

export const getters = {
  THREADS(store) {
    return store.threads;
  },

  THREAD(store) {
    return store.thread;
  },
};

export const mutations = {
  SET_THREADS(store, threads) {
    Vue.set(store, 'threads', threads);
  },

  SET_THREAD(store, thread) {
    Vue.set(store, 'thread', thread);
  },
};

export const actions = {
  async fetchOne({ state, commit }, { boardName, threadId }) {
    const url = `/4chan/info/boards/${ boardName }/threads/${ threadId }`;
    const { error, data } = await this.$api.$get(url);

    if (error) {
      return;
    }

    commit('SET_THREAD', data);

    return state.thread;
  },

  async fetch({ state, commit }, { boardName }) {
    const url = `/4chan/info/boards/${ boardName }/threads`;
    const { error, data } = await this.$api.$get(url);

    if (error) {
      return;
    }

    commit('SET_THREADS', data);

    return state.threads;
  },

};
