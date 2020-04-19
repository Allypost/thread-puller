import { Listener } from '@nuxt/server';
import http from 'http';
import socketIO from 'socket.io';
import presence from '../api/presence';

export default function() {
    this.nuxt.hook('render:before', async (renderer) => {
        const server = http.createServer(renderer.app);

        // overwrite nuxt.server.listen()
        this.nuxt.server.listen =
            async function listen(port, host, socket) {
                // Ensure nuxt is ready
                await this.nuxt.ready();

                // Create a new listener
                const listener = new Listener({
                    port: isNaN(parseInt(port)) ? this.options.server.port : port,
                    host: host || this.options.server.host,
                    socket: socket || this.options.server.socket,
                    https: this.options.server.https,
                    app: this.app,
                    dev: this.options.dev,
                    baseURL: this.options.router.base,
                });

                // Listen
                await listener.listen();

                // Push listener to this.listeners
                this.listeners.push(listener);

                // Attach IO server to the nuxt server
                const io = socketIO(listener.server);

                await this.nuxt.callHook('listen', listener.server, listener);

                // Start presence
                await presence(io);

                return listener;
            }
        ;

        // close this server on 'close' event
        this.nuxt.hook(
            'close',
            () =>
                new Promise(server.close)
            ,
        );
    });
}
