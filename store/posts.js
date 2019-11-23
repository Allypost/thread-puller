import { get } from 'axios';
import Vue from 'vue';
import { mutationSet } from './helpers/entryCRUD';

function baseUrl(isServer) {
    if (isServer) {
        return `http://localhost:${ process.env.PORT }`;
    } else {
        return '';
    }
}

async function fetchPosts(boardName, threadId, isServer) {
    try {
        const { data } = await get(`${ baseUrl(isServer) }/api/boards/${ boardName }/thread/${ threadId }`, { responseType: 'json' });

        return data;
    } catch (e) {
        return null;
    }
}

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

    async fetch({ state, commit }, { boardName, threadId, isServer }) {
        const posts = await fetchPosts(boardName, threadId, isServer);

        if (!posts) {
            return;
        }

        commit('set', posts);

        return state.entries;
    },

};
