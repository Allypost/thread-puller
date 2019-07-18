import io from 'socket.io-client';
import { onReady } from './src/util/onReady';

class Presence {
    constructor(url) {
        this.socket = io(url);

        this.socket.on('connect', () => this.addListeners());
    }

    pageData() {
        return {
            title: document.title,
            link: window.location.href,
            page: window.location.pathname,
        };
    }

    cookieData() {
        const { threadpuller_presence } = this.getCookies();

        return threadpuller_presence;
    }

    getCookies() {
        const { cookie = '' } = document;

        return (
            cookie
                .split('; ')
                .map(cookie => cookie.split('='))
                .map(([ name, ...rest ]) => ([ name, rest.join('=') ]))
                .reduce((acc, [ k, v ]) => Object.assign(acc, { [ k ]: v }), {})
        );
    }

    getFocusListener(focused) {
        return () => {
            const { socket } = this;

            socket.emit('focus', focused);
        };
    }

    addListeners() {
        const { socket } = this;

        socket.emit('location', this.pageData(), this.cookieData());

        window.addEventListener('focus', this.getFocusListener(true));
        window.addEventListener('blur', this.getFocusListener(false));

        this.getFocusListener(document.hasFocus())();
    }
}

onReady(() => new Presence(window.bootData.presenceUrl));
