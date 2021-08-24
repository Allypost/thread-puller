import axios from 'axios';
import type {
  AxiosRequestConfig,
} from 'axios';
import consola from 'consola';
import {
  HttpStatus,
} from '../../Helpers/Http';

const sleep =
  (ms: number): Promise<void> =>
    new Promise(
      (resolve) =>
        setTimeout(resolve, ms)
      ,
    )
;

export const getter =
  (name: string, referer: string) =>
    async <T, R>(url: string, defaultValue: R = {} as R): Promise<T | R> => {
      const retryAttempts = 5;
      const sleepMinMs = 150;
      const sleepMaxMs = 350;

      for (let attempt = 0; attempt < retryAttempts; attempt++) {
        try {
          const config: AxiosRequestConfig = {
            headers: {
              'Referer': referer,
              'User-Agent': 'ThreadPuller crawler (thread-puller.party)',
            },
            responseType: 'json',
          };
          return await axios.get<T>(url, config).then(({ data }) => data);
        } catch (e) {
          const { response = {} } = e;

          if (response.status === HttpStatus.Error.Client.NotFound) {
            consola.error(`${ name } 404 for url`, url);
            // Break out of for loop
            break;
          }

          consola.log(Object.fromEntries(Object.entries(e)));
          consola.error(`(${ attempt + 1 }/${ retryAttempts }) ${ name } fetch error`, url, e);

          const randTime = ((sleepMaxMs - sleepMinMs) * Math.random()) + sleepMinMs;

          await sleep((attempt + 1) * randTime);
        }
      }

      return defaultValue;
    }
;
