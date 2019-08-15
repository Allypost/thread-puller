import { get } from 'axios';
import { callStorage } from '../../../lib/Redis/redis';

export default class Boards {

    static async get() {
        const cachedBoards = await this.getCached();

        if (
            cachedBoards
            && Boolean(cachedBoards.length)
        ) {
            return cachedBoards;
        }

        return this.setCached(await this.getLive());
    }

    static async info(board) {
        const boards = await this.get();

        return boards.find((b) => b.board === board);
    }

    static async getLive() {
        const options = {
            'headers': {
                'Referer': 'https://4chan.org/',
                'User-Agent': 'ThreadPuller',
            },
            'responseType': 'json',
        };

        const { data = {} } = await get('https://a.4cdn.org/boards.json', options) || {};
        const { boards } = data;

        if (!boards) {
            return [];
        }

        // noinspection JSUnresolvedVariable
        return (
            boards
                .map((board) => (
                    {
                        title: board.title,
                        board: board.board,
                        link: `/${ board.board }/`,
                        description: board.meta_description,
                        nsfw: !board.ws_board,
                    }
                ))
        );
    }

    static async getCached() {
        const cacheKey = 'boards';

        const data = await callStorage('get', cacheKey);

        if (data) {
            return JSON.parse(data);
        } else {
            if (data) {
                await callStorage('del', cacheKey);
            }
        }

        return null;
    }

    static async setCached(boards) {
        if (!boards) {
            return null;
        }

        if (callStorage && boards.length) {
            const timeout = Number(process.env.THREADPULLER_API_CACHE_FOR) * 4;

            await callStorage(
                'set',
                'boards',
                JSON.stringify(boards),
                'EX',
                String(timeout),
            );
        }

        return boards;
    }

    static baseUrl() {
        return 'https://boards.4chan.org';
    }

}
