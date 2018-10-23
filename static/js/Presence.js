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

    addListeners() {
        const { socket } = this;

        socket.emit('location', this.pageData());
    }
}
