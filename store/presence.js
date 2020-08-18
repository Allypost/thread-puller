export const state = () => (
  {
    name: '',
    id: '',
    connected: false,
  }
);

export const getters = {
  id({ id }) {
    return id;
  },

  name({ name }) {
    return name;
  },

  connected({ connected }) {
    return connected;
  },

  get({ id, name }) {
    return { id, name };
  },
};

export const mutations = {
  SET_ID(state, newID) {
    state.id = newID;
  },

  SET_NAME(state, newName) {
    state.name = newName;
  },

  SET_PRESENCE(state, { id, name }) {
    state.id = id;
    state.name = name;
  },

  SET_CONNECTED(state, connected = true) {
    state.connected = Boolean(connected);
  },
};
