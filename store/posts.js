import Vue from 'vue';
import {
  mutationSet,
} from './helpers/entryCRUD';

export const state = () => (
  {
    entries: [],
    focused: null,
  }
);

export const getters = {
  get({ entries }) {
    return entries;
  },

  getFocused({ focused }) {
    return focused;
  },
};

export const mutations = {
  ...mutationSet(),

  setFocused(store, postId) {
    const focused = store.entries.find(({ id }) => id === postId);

    Vue.set(store, 'focused', focused);
  },

  setUnfocused(store) {
    Vue.set(store, 'focused', null);
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

    if (!posts) {
      return;
    }

    commit('set', posts);

    return state.entries;
  },

};
