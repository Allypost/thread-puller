import { get } from 'axios';

function baseUrl(isServer) {
    if (isServer) {
        return `http://localhost:${ process.env.PORT }`;
    } else {
        return '';
    }
}

async function fetchPosts(boardName, threadId, isServer) {
    const { data } = await get(`${ baseUrl(isServer) }/api/boards/${ boardName }/thread/${ threadId }`, { responseType: 'json' });

    return data;
}

export const state = () => (
    {
        entries: [],
    }
);

export const getters = {
    get({ entries }) {
        return entries;
    },
};

export const mutations = {
    set({ entries }, newEntries) {
        Object.assign(entries, newEntries);
    },
};

export const actions = {

    async fetch({ state, commit }, { boardName, threadId, isServer }) {
        const posts = await fetchPosts(boardName, threadId, isServer);

        commit('set', posts);

        return state.entries;
    },

};