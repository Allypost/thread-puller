class Download {

    constructor(selector) {
        this.options = new Proxy({}, this._proxyHandler());
        this.options.localUrl = 'http://localhost:8135';
        this.options.downloaderActive = false;
        this.options.selector = selector;

        this.init();
    }

    getElements() {
        const { selector } = this.options;

        return Array.from(document.querySelectorAll(selector));
    }

    async init() {
        const elements = this.getElements();

        setInterval(this.updateDownloaderStatus.bind(this), 3000);

        this.updateDownloaderStatus();
        this.addDownloadButtons(elements);
    }

    async updateDownloaderStatus() {
        this.options.downloaderActive = await this.checkDownloader();
    }

    async thread(el, evt) {
        const downloadEl = el.querySelector('.download a');

        if (evt.target !== downloadEl)
            return true;

        evt.preventDefault();

        const { board, thread, downloading } = el.dataset;

        if (downloading)
            return false;

        console.log(`Downloading ${board}/${thread}`);
        downloadEl.innerText = 'Downloading...';
        el.dataset.downloading = '1';

        const url = `${this.options.localUrl}/${board}/${thread}`;

        return (
            fetch(url)
                .then((res) => res.json())
                .then(() => {
                    console.log(`Downloaded ${board}/${thread}`);
                    downloadEl.innerText = 'Downloaded';
                })
                .catch(() => {
                    console.warn(`Download of ${board}/${thread} failed`);
                    downloadEl.innerText = 'Error downloading';
                })
                .finally(() => {
                    delete el.dataset.downloading;
                    setTimeout(() => downloadEl.innerText = 'Download', 5000);
                })
        );
    }

    async addDownloadButtons(elements) {
        elements.map((el) => {
            const listener = this.thread.bind(this, el);

            this
                .addDownloadButton(el)
                .addEventListener('click', listener);
        });
    }

    addDownloadButton(el) {
        if (el.querySelector('.download')) {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);

            return newEl;
        }

        const link = document.createElement('a');
        link.href = `#${el.id}`;
        link.innerText = 'Download';

        const section = document.createElement('section');
        section.classList.add('download');
        section.appendChild(link);

        el.dataset.shown = this.options.downloaderActive ? 'yes' : 'no';
        el.insertBefore(section, el.querySelector('footer'));

        return el;
    }

    async checkDownloader() {
        return new Promise((resolve) => {
            fetch(`${this.options.localUrl}/ping`)
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    toggleDownloadButton(show = false) {
        const elements = this.getElements();

        elements.forEach((el) => {
            el.dataset.shown = show ? 'yes' : 'no';
        });
    }

    _proxyHandler() {
        const toggleButtons = this.toggleDownloadButton.bind(this);

        return {
            set(obj, prop, value) {
                if (
                    prop === 'downloaderActive'
                    && obj[ prop ] !== prop
                )
                    toggleButtons(value);

                obj[ prop ] = value;
                return true;
            },
        };
    }

}
