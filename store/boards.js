import { get } from 'axios';
import { mutationSet } from './helpers/entryCRUD';

function baseUrl(isServer) {
    if (isServer) {
        return `http://localhost:${ process.env.PORT }`;
    } else {
        return '';
    }
}

async function fetchBoard(board, isServer) {
    try {
        const { data } = await get(`${ baseUrl(isServer) }/api/board/${ board }`, { responseType: 'json' });

        return data;
    } catch (e) {
        return null;
    }
}

async function fetchBoards(isServer) {
    try {
        const { data } = await get(`${ baseUrl(isServer) }/api/boards`, { responseType: 'json' });

        return data;
    } catch (e) {
        return null;
    }
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
    ...mutationSet({ identifierKey: 'board' }),
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

        if (!boards) {
            return;
        }

        commit('set', boards);

        return state.entries;
    },

};
