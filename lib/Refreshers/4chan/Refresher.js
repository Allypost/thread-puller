import consola from 'consola';
import Boards from '../../Fetchers/4chan/Boards';
import Threads from '../../Fetchers/4chan/Threads';

const timeout = Number(process.env.THREADPULLER_API_CACHE_FOR) * 1000;

/**
 * Get a random number in range [`min`, `max`]
 *
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * Sleep for `ms` milliseconds
 *
 * @param {Number} ms
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {Function} fetchFn
 * @param {Number} minFraction
 * @param {Number} maxFraction
 * @returns {Promise<void>}
 */
async function doRefresh(fetchFn, minFraction, maxFraction) {
    const True = true;

    while (True) {
        const time = randomNumber(
            timeout * minFraction,
            timeout * maxFraction,
        );

        try {
            await fetchFn();
        } catch (e) {
            consola.error(e);
        }

        await sleep(time);
    }
}

export async function boardListRefresher() {
    return doRefresh(Boards.refreshCached.bind(Boards), 3 / 4, 1);
}

export async function boardsRefresher() {
    const boards = await Boards.get();

    for (const { board } of boards) {
        doRefresh(Threads.refreshCached.bind(Threads, board), 1 / 2, 3 / 4);
    }
}

export const refreshers = [ boardListRefresher, boardsRefresher ];
