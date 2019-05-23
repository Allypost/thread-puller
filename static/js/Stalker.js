Vue.component('stalker-entry', {
    props: [ 'entry' ],
    // language=Vue
    template: `
        <li :data-focused="isFocused">
            [<img class="country-flag" :src="flagUrl" :alt="geo.country" :title="flagTitle"> | {{ geo.city || 'Unknown' }}]
            <span v-if="isLoading"><i>Loading...</i></span>
            <a :href="location.link" v-else>{{ location.title }}</a>
        </li>
    `,
    computed: {
        isFocused() {
            return Boolean(this.entry.focus);
        },

        isLoading() {
            return this.location.loading === true;
        },

        location() {
            return this.entry.location;
        },

        geo() {
            return this.entry.geo || {};
        },

        flagTitle() {
            const {
                      country = 'Unknown',
                      region  = 'Unknown',
                  } = this.geo;
            return `${country}, ${region}`;
        },

        flagUrl() {
            const {
                      country = 'XK',
                  } = this.geo;
            return `https://www.countryflags.io/${country}/flat/24.png`;
        },
    },
});

Vue.component('stalker-group', {
    props: [ 'entry' ],
    // language=Vue
    template: `
        <li class="stalker-group">
            <details open class="stalker-group-container">
                <summary>
                    <span class="session-id">{{ id }}</span>
                    <span class="metadata">
                        <span class="country-flags">
                            <img v-for="country in countries" :src="country.src" :alt="country.alt">
                        </span>
                    </span>
                </summary>
                <ol>
                    <stalker-entry v-for="session in sessions" :entry="session" />
                </ol>
            </details>
        </li>
    `,
    computed: {
        id() {
            return this.entry[ 0 ];
        },

        sessions() {
            return Object.values(this.entry[ 1 ]);
        },

        countries() {
            const countries = {};

            for (const session of this.sessions) {
                const {
                          country,
                          region = 'Unknown region',
                          city   = 'Unknown city',
                      } = session.geo;

                const countryCode = country || 'XK';
                const countryName = country || 'Unknown country';

                countries[ countryCode ] = {
                    src: `https://www.countryflags.io/${countryCode}/flat/24.png`,
                    alt: `${countryName}, ${region}, ${city}`,
                };
            }

            return Object.values(countries);
        },
    },
});

Vue.component('stalker-container', {
    props: [ 'entries' ],
    // language=Vue
    template: `
        <ol class="container" v-if="parsedEntries.length">
            <stalker-group v-for="entry in parsedEntries" :entry="entry" />
        </ol>
        <h3 v-else>
            Nobody online :(
        </h3>
    `,
    computed: {
        parsedEntries() {
            return Object.entries(this.entries);
        },
    },
});

class Stalker {

    constructor(rootElement, presenceUrl = '') {
        this.root = rootElement;
        this.socket = this.connect(presenceUrl);
        this.data = { entries: [], stalker: this };
        /**
         * @var Vue
         */
        this.vue = new Vue(
            {
                el: `#${this.root.id}`,
                data: this.data,
                template: `<stalker-container :entries="entries" />`,
            });

        this.initUpdater();
    }

    connect(url) {
        const socket = window.io(url, { query: 'monitor=1' });
        const updater = this.updateData.bind(this);

        socket.emit('get:all', updater);

        const updateUser = (data, loading) => {
            const { presenceId, sessionId } = data;
            const { entries = {} } = this.data;
            const { [ presenceId ]: sessions } = entries;

            if (!sessions)
                Vue.set(entries, presenceId, {});

            Vue.nextTick(() => {
                const sessionObj = sessions || entries[ presenceId ];
                const { [ sessionId ]: session } = sessionObj;

                Vue.set(sessionObj, sessionId, data);

                if (session)
                    session.loading = loading;
            });
        };

        const removeUser = (data) => {
            const { presenceId, sessionId } = data;
            const { entries = {} } = this.data;
            const { [ presenceId ]: sessions = {} } = entries;

            if (Object.keys(sessions).length === 1)
                Vue.delete(entries, presenceId);
            else
                Vue.delete(sessions, sessionId);
        };

        socket.on('user:update', ({ type, data = {}, loading = false }) => {
            switch (type) {
                case 'update':
                    updateUser(data, loading);
                    break;
                case 'leave':
                    removeUser(data);
                    break;
                default:
                    socket.emit('get:all', updater);
                    break;
            }
        });

        return socket;
    }

    updateData(rawData) {
        const data =
                  Object
                      .values(rawData)
                      .sort((a, b) => a.date - b.date)
                      .reduce((acc, el) => {
                          const key = el.presenceId || Object.values(el.geo).join('-');
                          const { [ key ]: value = {} } = acc;

                          acc[ key ] = Object.assign(value, { [ el.sessionId ]: el });

                          return acc;
                      }, {});

        Vue.set(this.vue, 'entries', data);
    }

    initUpdater() {
        setInterval(this.updater.bind(this), 15 * 1000);
    }

    updater() {
        this.socket.emit('all', this.updateData.bind(this));
    }

}
