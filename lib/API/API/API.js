class API {

    constructor() {
        this.VERSION = 'v1';
    }

    embedApiLinks(resp, board, thread) {
        if (Array.isArray(resp))
            return resp.map(el => this.embedApiLinks(el, board, thread));

        if (!resp)
            return resp;

        const base = process.env.THREADPULLER_DOMAIN_API;
        const api = {
            boards_link: `${base}/${this.VERSION}/boards`,
        };
        const data = {
            board: board || resp.link.replace(/^[\/]+|[\/]+$/g, ''),
            thread: thread || resp.id,
        };

        if (data.board)
            api.board_link = `${api.boards_link}/${data.board}`;

        if (data.thread)
            api.thread_link = `${api.board_link}/thread/${data.thread}`;

        return Object.assign(
            {},
            resp,
            { api },
        );
    }

}

module.exports = API;
