class API {

    constructor(baseUrl, version) {
        this.VERSION = version || 'v1';
        this.baseUrl = baseUrl || `${process.env.THREADPULLER_DOMAIN_API}/${this.VERSION}`;
    }

    embedApiLinks(resp, board, thread) {
        if (Array.isArray(resp))
            return resp.map(el => this.embedApiLinks(el, board, thread));

        if (!resp)
            return resp;

        const api = {
            boards_link: `${this.baseUrl}/boards`,
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
