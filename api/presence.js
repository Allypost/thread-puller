const { callStorage, publishEvent } = require('../lib/Redis/redis');

const REDIS_PREFIX = 'presence:';
const DATA_TIMEOUT_SECONDS = 60 * 3;

function isFunction(value) {
    if (!value) {
        return false;
    }

    if ('[object Function]' === Object.prototype.toString.call(value)) {
        return true;
    }

    if ('function' === typeof value) {
        return true;
    }

    return value instanceof Function;
}

function redisSocketKey(socket, infix = '') {
    const { id } = socket.presence;

    if (!infix) {
        return `${ REDIS_PREFIX }${ id }:${ socket.id }`;
    }

    const fixedInfix =
              infix
                  .trim()
                  // Remove `:` characters from start
                  .replace(/^:+/, '')
                  // Remove `:` characters from end
                  .replace(/:+$/, '')
    ;

    return `${ REDIS_PREFIX }${ fixedInfix }:${ id }:${ socket.id }`;
}

async function clean() {
    return await callStorage('clean-old-presence-data', `${ REDIS_PREFIX }*`);
}

async function updatePresence(socket, newData) {

    const { id, data: oldData } = socket.presence;

    const redisKey = redisSocketKey(socket);

    const oldPage = oldData.page;
    const updatedLocation = newData.page !== undefined && oldPage !== newData.page;

    const {
              page  = oldData.page,
              focus = oldData.focus,
          } = newData;

    const data = {
        page: String(page),
        focus: Boolean(focus),
    };

    Object.assign(socket.presence.data, data);

    await callStorage('set', redisKey, JSON.stringify(data), 'EX', DATA_TIMEOUT_SECONDS);
    await publishEvent(redisSocketKey(socket, 'update'), { id, data });

    if (updatedLocation) {
        socket.leave(oldPage);
        socket.join(data.page);

        socket.server.to(oldPage).emit('event:peers:page:count', getSocketPagePeerCount(socket.server, { page: oldPage }));
        socket.server.to(data.page).emit('event:peers:page:count', getSocketPagePeerCount(socket.server, { page: data.page }));
    }

    return data;
}

function getSocketPagePeerCount(io, { page } = {}) {
    if (!page) {
        return 0;
    }

    const { [ page ]: room = {} } = io.sockets.adapter.rooms;
    const { sockets = {} } = room;

    return Object.keys(sockets).length;
}

function getSocketPagePeers(io, { page } = {}) {
    if (!page) {
        return null;
    }

    const { [ page ]: room = {} } = io.sockets.adapter.rooms;
    const { sockets = {} } = room;

    return (
        Object
            .keys(sockets)
            .reduce((acc, id) => {
                const { presence } = io.sockets.sockets[ id ];
                const
                    {
                        id: presenceID,
                        data: {
                            focus,
                        },
                    } = presence;

                if (!acc[ presenceID ]) {
                    acc[ presenceID ] = [];
                }

                acc[ presenceID ].push({ id, focus });

                return acc;
            }, {})
    );
}


function getSocketPeers(io, { groupBy = 'page', path = null } = {}) {
    function getPageRooms(io) {
        const { rooms } = io.sockets.adapter;

        if (path && rooms[ path ]) {
            return [ path ];
        } else {
            return (
                Object
                    .keys(rooms)
                    .filter((name) => name.startsWith('/'))
            );
        }
    }

    function byPage(io) {
        const rooms = getPageRooms(io);

        return (
            rooms
                .reduce((acc, page) => {
                    acc[ page ] = getSocketPagePeers(io, { page });

                    return acc;
                }, {})
        );
    }

    function byID(io) {
        const rooms = getPageRooms(io);

        return (
            rooms
                .reduce((acc, page) => {
                    const pagePeers = getSocketPagePeers(io, { page });

                    for (const [ id, sessions ] of Object.entries(pagePeers)) {
                        if (!acc[ id ]) {
                            acc[ id ] = [];
                        }

                        acc[ id ].push(...sessions.map((session) => Object.assign(session, { page })));
                    }

                    return acc;
                }, {})
        );
    }

    switch (groupBy) {
        case 'id':
            return byID(io);
        case 'page':
        default:
            return byPage(io);
    }
}

function addListeners(socket) {
    const io = this;

    socket.on('update:location', async (data, cb = null) => {
        await updatePresence(socket, data);

        if (isFunction(cb)) {
            cb();
        }
    });

    socket.on('update:focus', async (isFocused, cb = null) => {
        await updatePresence(socket, { focus: isFocused });

        if (isFunction(cb)) {
            cb();
        }
    });

    socket.on('get:peers:page', (path, cb = null) => {
        if (!isFunction(cb)) {
            return;
        }

        const { data: presence } = socket.presence;
        const { page } = presence;

        const data = getSocketPagePeers(io, { page: path || page });

        cb(data);
    });

    socket.on('get:peers:page:count', (page, cb = null) => {
        if (!isFunction(cb)) {
            return;
        }

        cb(getSocketPagePeerCount(io, { page }));
    });

    socket.on('get:peers:all', (cb = null) => {
        if (!isFunction(cb)) {
            return;
        }

        const data = getSocketPeers(io, { groupBy: 'page' });

        cb(data);
    });

    socket.on('get:peers:all:by-id', (cb = null) => {
        if (!isFunction(cb)) {
            return;
        }

        const data = getSocketPeers(io, { groupBy: 'id' });

        cb(data);
    });
}


module.exports = async function(io) {
    await clean();

    io.on('connection', (socket) => {
        const {
                  query: {
                      monitor,
                  },
              } = socket.handshake;

        socket.monitoring = Boolean(monitor);

        socket.on('register', (id, cb) => {
            if (!id || !cb || !isFunction(cb)) {
                socket.disconnect();
                return;
            }

            socket.presence = {
                id,
                data: {},
            };

            cb();
            addListeners.call(io, socket);
        });

        socket.on('disconnect', async () => {
            if (!socket.presence) {
                return;
            }

            const { id } = socket.presence;

            await updatePresence(socket, { page: null });
            await callStorage('del', redisSocketKey(socket));
            await publishEvent(redisSocketKey(socket, 'delete'), { id });
        });

    });

};
