export const state = () => ({
    boards: [],
    counter: 0,
});

export const getters = {
    boards(state) {
        return state.boards;
    },
};

export const mutations = {
    set(state, newData) {
        Object.assign(state.boards, newData);
    },
};

export const actions = {

    async nuxtServerInit({ commit }) {
        const options = {
            'headers': {
                'Referer': 'https://4chan.org/',
                'User-Agent': 'ThreadPuller',
            },
            'responseType': 'json',
        };

        const data = await this.$axios.$get('https://a.4cdn.org/boards.json', options);

        if (!data || !data.boards)
            return [];

        // noinspection JSUnresolvedVariable
        const boards =
                  data
                      .boards
                      .map((board) => ({
                          title: board.title,
                          board: board.board,
                          link: `/${board.board}/`,
                          description: board.meta_description,
                          nsfw: !board.ws_board,
                      }));

        commit('set', boards);
    },

};
