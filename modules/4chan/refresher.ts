import type {
  Module,
} from '@nuxt/types';
import consola from 'consola';
import {
  EntityStore,
} from '../../lib/Refreshers/4chan/Refresher';

const module: Module = function () {
  let intervalId: ReturnType<typeof setInterval>;

  const info =
    (message: string) =>
      consola.info({
        message,
        badge: true,
      })
  ;

  this.nuxt.hook('listen', async () => {
    info('Cleaning old refresher data...');
    await EntityStore.clean();
    info('Populating refresher...');
    await EntityStore.populate();
    info('Starting refresher listener...');
    intervalId = setInterval(() => EntityStore.processOne(), 2500);
    info('Refresher started');
  });

  this.nuxt.hook('close', () => {
    info('Shutting down refresher listener...');
    clearInterval(intervalId);
    info('Refresher shut down');
  });
};

export default module;
