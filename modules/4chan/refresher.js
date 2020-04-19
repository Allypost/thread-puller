import consola from 'consola';
import { clean, populate, processOne } from '../../lib/Refreshers/4chan/Refresher';

export default function refresher() {
    let intervalId = null;

    const info = (message) => consola.info({ message, badge: true });

    this.nuxt.hook('listen', async () => {
        info('Cleaning old refresher data...');
        await clean();
        info('Populating refresher...');
        await populate();
        info('Starting refresher listener...');
        intervalId = setInterval(() => processOne(), 2500);
        info('Refresher started');
    });

    this.nuxt.hook('close', async () => {
        info('Shutting down refresher listener...');
        clearInterval(intervalId);
        info('Refresher shut down');
    });
}
