export const state = () => (
    {
        name: '',
        id: '',
    }
);

export const getters = {
    id({ id }) {
        return id;
    },

    name({ name }) {
        return name;
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
};
