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

    addListeners() {
        const { socket } = this;

        socket.emit('location', this.pageData(), this.cookieData());
    }
}