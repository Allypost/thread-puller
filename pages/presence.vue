<template>
  <div class="container">
    <h4>Currently online: {{ usersOnPage }}</h4>
    <h3>Pages:</h3>
    <ul v-if="usersOnPage > 0">
      <li
        v-for="[presenceId, presences] in userList"
        :key="presenceId"
      >
        {{ presenceId }}
        <ul>
          <li
            v-for="[socketId, data] in presences"
            :key="socketId"
            :title="socketId"
          >
            <span
              :class="{ focused: data.focus }"
              class="focus-indicator"
              title="Focused"
            >
              F
            </span>
            <a
              :href="data.page"
              target="_blank"
            >
              {{ data.page }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
  import {
    mapState,
  } from 'vuex';
  import {
    socket,
  } from '../lib/SocketIO/socket';

  export default {
    name: 'Presence',

    data: () => ({
      users: {},
    }),

    computed: {
      userList() {
        return (
          Object
            .entries(this.users)
            .map(
              ([ presenceId, presences ]) =>
                [
                  presenceId,
                  Object.entries(presences),
                ]
              ,
            )
        );
      },

      usersOnPage() {
        return this.userList.length;
      },

      ...mapState([ 'presence' ]),
    },

    watch: {
      'presence.connected'(newValue) {
        if (true === newValue) {
          this.registerSocketListeners();
        }
      },
    },

    mounted() {
      if (this.presence.connected) {
        this.registerSocketListeners();
      }
    },

    methods: {
      registerSocketListeners() {
        socket.emit('monitor:join');

        socket.emit('get:peers:all:by-id', (users) => {
          const fixedUsers = Object.fromEntries(
            Object
              .entries(users)
              .map(
                ([ presenceId, entries ]) =>
                  [
                    presenceId,
                    Object.fromEntries(
                      entries
                        .filter(
                          ({ id }) =>
                            id !== this.presence.id
                          ,
                        )
                        .map(
                          ({ id, ...rest }) =>
                            [ id, rest ]
                          ,
                        ),
                    ),
                  ]
                ,
              ),
          );

          this.$set(this, 'users', fixedUsers);
        });

        socket.on('user:update', ({ type, data: { id, socketId, data } }) => {
          switch (type.toLowerCase()) {
            case 'update': {

              if (!(id in this.users)) {
                this.$set(this.users, id, {});
              }

              this.$set(this.users[ id ], socketId, data);

              break;
            }
            case 'delete': {
              this.$delete(this.users[ id ], socketId);

              if (1 > Object.keys(this.users[ id ]).length) {
                this.$delete(this.users, id);
              }

              break;
            }
          }
        });
      },
    },

    head() {
      return {
        title: 'Presence Spy',
      };
    },
  };
</script>

<style lang="scss" scoped>
  @import "../assets/style/modules/include";

  .container {
    text-align: left;

    > * {
      cursor: default;
    }
  }

  .focus-indicator {
    font-weight: bold;
    transition: opacity .1s ease-out;
    opacity: 0;
    color: $warning-color;

    &.focused {
      cursor: help;
      opacity: 1;
    }
  }
</style>
