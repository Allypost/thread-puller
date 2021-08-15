import Vue from 'vue';

export const state = () => (
  {
    posts: [],
    focused: null,
  }
);

export const getters = {
  posts(state) {
    return state.posts;
  },

  focused(state) {
    return state.focused;
  },
};

export const mutations = {
  SET_POSTS(state, posts) {
    Vue.set(state, 'posts', posts);
  },

  SET_FOCUSED(state, postId) {
    const focused = state.posts.find(({ id }) => id === postId);

    Vue.set(state, 'focused', focused);
  },

  SET_UNFOCUSED(state) {
    Vue.set(state, 'focused', null);
  },
};

export const actions = {
  async fetch(
    {
      state,
      commit,
    },
    {
      boardName,
      threadId,
    },
  ) {
    const posts = await this.$api.$get(`/boards/${ boardName }/thread/${ threadId }`);

    commit('SET_POSTS', posts);

    return state.posts;
  },

};
