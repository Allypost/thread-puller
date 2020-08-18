import {
  get,
} from 'axios';
import {
  mutationSet,
} from './helpers/entryCRUD';

function baseUrl(isServer) {
  if (isServer) {
    return `http://localhost:${ process.env.PORT }`;
  } else {
    return '';
  }
}

async function fetchThreads(boardName, isServer) {
  try {
    const { data } = await get(`${ baseUrl(isServer) }/api/boards/${ boardName }/threads`, { responseType: 'json' });

    return data;
  } catch (e) {
    return null;
  }
}

async function fetchThread(boardName, threadId, isServer) {
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

  async fetchOne({ state, commit }, { boardName, threadId, isServer }) {
    const threads = await fetchThread(boardName, threadId, isServer);

    if (!threads) {
      return;
    }

    commit('set', threads);

    return state.entries.find((stateThread) => String(stateThread.id) === String(threads.id));
  },

  async fetch({ state, commit }, { boardName, isServer }) {
    const threads = await fetchThreads(boardName, isServer);

    if (!threads) {
      return;
    }

    commit('set', threads);

    return state.entries;
  },

};
