class API {

    constructor(baseUrl, version) {
        this.VERSION = version || 'v1';
        this.baseUrl = baseUrl || `${process.env.THREADPULLER_DOMAIN_API}/${this.VERSION}`;
    }

    getApiLinks(board = '', thread = '') {
        const api = {
            boards_link: `${this.baseUrl}/boards`,
        };

        if (board)
            api.board_link = `${api.boards_link}/${board}`;

        if (thread)
            api.thread_link = `${api.board_link}/thread/${thread}`;

        return api;
    }

    embedApiLinks(resp, board, thread) {
        if (Array.isArray(resp))
            return resp.map(el => this.embedApiLinks(el, board, thread));

        if (!resp)
            return resp;

        const data = {
            board: board || resp.link.replace(/^[\/]+|[\/]+$/g, ''),
            thread: thread || resp.id,
        };

        const api = this.getApiLinks(data.board, data.thread);

        return Object.assign(
            {},
            resp,
            { api },
        );
    }

}

module.exports = API;
