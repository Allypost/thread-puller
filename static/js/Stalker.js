class Stalker {

    constructor(rootElement, presenceUrl = '') {
        this.root = rootElement;
        this.socket = this.connect(presenceUrl);

        this.initUpdater();
    }

    connect(url) {
        const socket = window.io(url, { query: 'monitor=1' });
        const parser = this.parseData.bind(this);

        socket.emit('all', parser);

        socket.on('user:update', () => socket.emit('all', parser));

        return socket;
    }

    parseData(rawData) {
        const data =
                  Object
                      .values(rawData)
                      .sort((a, b) => a.date - b.date)
                      .reduce((acc, el) => {
                          const key = el.presenceId || Object.values(el.geo).join('-');
                          const { [ key ]: value = [] } = acc;

                          acc[ key ] = [ ...value, el ];

                          return acc;
                      }, {});

        this.updateStalk(Object.entries(data));
    }

    updateStalk(data) {
        const root = this.root;

        root.innerHTML = '';

        data
            .forEach(([ id, entries ]) => {
                const ol = document.createElement('ol');
                ol.className = 'stalker-group';

                entries.forEach((entry) => {
                    const li = document.createElement('li');

                    const $IP = entry.ip ? `<a href="https://whatismyipaddress.com/ip/${entry.ip}">IP</a> ` : '';

                    li.innerHTML = `${$IP}[<img src="https://www.countryflags.io/${entry.geo.country}/flat/24.png" alt="${entry.geo.country}" title="${entry.geo.country}, ${entry.geo.region}"> | ${entry.geo.city}] <a href="${entry.location.page}">${entry.location.title || entry.location.page}</a>`;
                    ol.appendChild(li);
                });

                const li = document.createElement('li');
                li.className = 'stalker-group-container';

                const div = document.createElement('div');
                div.innerText = id;
                li.appendChild(div);

                li.appendChild(ol);

                root.appendChild(li);
            });
    }

    initUpdater() {
        setInterval(this.updater.bind(this), 15 * 1000);
    }

    updater() {
        this.socket.emit('all', this.parseData.bind(this));
    }

}
