import Vue from 'vue';
import io from 'socket.io-client';

import StalkerContainer from './src/Stalker/components/container';

window.Stalker = class Stalker {

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
                components: { StalkerContainer },
            });

        this.initUpdater();
    }

    connect(url) {
        const socket = io(url, { query: 'monitor=1' });
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

};
