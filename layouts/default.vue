<style lang="scss" src="../assets/style/global.scss"></style>
<style lang="scss" scoped>
    @import "../assets/style/modules/include";

    #wrap {
        $footer-height: 2em;

        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        margin: 0;
        text-align: center;
        flex: 1 0 auto;

        .page-container {
            min-height: 100%;
            padding-bottom: $footer-height;
        }

        > footer {
            position: absolute;
            bottom: 0;
            align-self: center;
            flex-shrink: 0;
            height: $footer-height;
            max-width: 700px;
            margin: 0 auto;
            padding: 10px 18px;
            text-align: center;
            border-radius: 6px 6px 0 0;
            background: darken($background-color, 5%);

            @include no-select();
        }

    }
</style>

<template>
    <div id="wrap">
        <nuxt class="page-container" />
        <peer-count :socket="socket" />
        <footer>
            Copyright &copy; {{ new Date().getFullYear() }}
            <a
                v-if="hasRepositoryUrl"
                :href="repositoryUrl"
                rel="noopener noreferrer"
                target="_blank"
            >
                Allypost
            </a>
            <span
                v-else
            >
                Allypost
            </span>
            | All content is courtesy of
            <a
                href="https://www.4chan.org"
                rel="noopener noreferrer"
                target="_blank"
            >
                4chan
            </a>
            <span v-if="hasDonateLink">
                |
                <a
                    :href="donateLink"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    Buy me a coffee
                </a>
            </span>
        </footer>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import { socket } from '../lib/SocketIO/socket';
    import PeerCount from '../components/PeerCount';

    export default {
        components: { PeerCount },

        data: () => (
            {
                socket,
                donateLink: '',
                repositoryUrl: process.env.THREADPULLER_REPOSITORY_URL,
            }
        ),

        computed: {
            hasDonateLink() {
                return Boolean(this.donateLink);
            },

            hasRepositoryUrl() {
                return Boolean(this.repositoryUrl);
            },

            presenceID() {
                const { id } = this.presence;

                return id;
            },

            ...mapGetters({
                'presence': 'presence/get',
            }),
        },

        watch: {
            '$route.path'(path) {
                this.updateLocation(path);
            },
        },

        mounted() {
            if (this.socket.connected) {
                this.registerSocketListeners();
            } else {
                this.socket.on('connect', () => this.registerSocketListeners());
            }
        },

        methods: {
            registerSocketListeners() {
                this.socket.emit('register', this.presenceID, () => {
                    this.updateLocation();
                    window.addEventListener('focus', this.getFocusListener(true));
                    window.addEventListener('blur', this.getFocusListener(false));

                    this.socket.on('page-data:update', async ({ board, thread, data }) => {
                        if (board && thread) {
                            return this.updatePosts(data);
                        }

                        if (board && !thread) {
                            return this.updateThreads(data);
                        }

                        if (!board && !thread) {
                            return this.updateBoards(data);
                        }
                    });
                });
            },

            getFocusListener(focused) {
                return () => {
                    this.socket.emit('update:focus', focused);
                };
            },

            getPageData(pageOverride = null) {
                const { params } = this.$route;

                return {
                    page: pageOverride || window.location.pathname,
                    focus: document.hasFocus(),
                    params,
                };
            },

            updateLocation(pageOverride = null) {
                this.socket.emit(
                    'update:location',
                    this.getPageData(pageOverride),
                );
            },

            async updateBoards(boards) {
                return await this.doUpdate(boards, 'boards', 'board');
            },

            async updateThreads(threads) {
                return await this.doUpdate(threads, 'threads');
            },

            async updatePosts(posts) {
                return await this.doUpdate(posts, 'posts');
            },

            async doUpdate(newEntries, storeName, identifierKey = 'id') {
                const oldEntries = this.$store.getters[ `${ storeName }/get` ];

                for (const newEntry of newEntries) {
                    const oldEntryIndex = oldEntries.findIndex((oldEntry) => oldEntry[ identifierKey ] === newEntry[ identifierKey ]);

                    if (-1 === oldEntryIndex) {
                        this.$store.commit(`${ storeName }/add`, newEntry);
                    } else {
                        this.$store.commit(`${ storeName }/update`, newEntry);
                    }
                }

                // Get list of entries only in
                // the old list (aka deleted entries)
                // and remove them from the store
                oldEntries
                    .filter(
                        ({ [ identifierKey ]: oldEntryId }) =>
                            !newEntries.find(
                                ({ [ identifierKey ]: newEntryId }) =>
                                    oldEntryId === newEntryId,
                            ),
                    )
                    .forEach(
                        ({ id }) =>
                            this.$store.commit(`${ storeName }/remove`, id),
                    )
                ;
            },
        },

        head() {
            return {
                titleTemplate(titleChunk) {
                    if (titleChunk) {
                        return `${ titleChunk } | ThreadPuller`;
                    }

                    return 'ThreadPuller - Pull 4Chan media';
                },
            };
        },
    };
</script>

