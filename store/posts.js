import Vue from 'vue';

export const state = () => (
  {
    posts: [],
  }
);

export const getters = {
  POSTS(store) {
    return store.posts;
  },
};

export const mutations = {
  SET_POSTS(store, threads) {
    Vue.set(store, 'posts', threads);
  },
};

export const actions = {
  async fetch({ state, commit }, { boardName, threadId }) {
    const url = `/4chan/info/boards/${ boardName }/threads/${ threadId }/posts`;
    const { error, data } = await this.$api.$get(url);

    if (error || !Array.isArray(data)) {
      return [];
    }

    commit('SET_POSTS', data);

    return state.posts;
  },
};
