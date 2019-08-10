import { get } from 'axios';

function baseUrl(isServer) {
    if (isServer) {
        return `http://localhost:${ process.env.PORT }`;
    } else {
        return '';
    }
}

async function fetchBoard(board, isServer) {
    const { data } = await get(`${ baseUrl(isServer) }/api/board/${ board }`, { responseType: 'json' });

    return data;
}

async function fetchBoards(isServer) {
    const { data } = await get(`${ baseUrl(isServer) }/api/boards`, { responseType: 'json' });

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

    getOne({ entries }) {
        return (boardName) => entries.find((board) => board.board === boardName);
    },
};

export const mutations = {
    set({ entries }, newEntries) {
        Object.assign(entries, newEntries);
    },

    add({ entries }, ...newEntries) {
        Object.assign(entries, newEntries);
    },
};

export const actions = {

    async fetchOne({ state, commit }, { boardName, isServer }) {
        const board = await fetchBoard(boardName, isServer);

        if (!board) {
            return;
        }

        commit('add', board);

        return state.entries.find((b) => b.name === board.name);
    },

    async fetch({ state, commit }, { isServer }) {
        const boards = await fetchBoards(isServer);

        commit('set', boards);

        return state.entries;
    },

};
