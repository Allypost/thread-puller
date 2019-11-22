<style scoped lang="scss">
    @import "../assets/style/modules/include";

    .container {
        @extend %container-base;
    }

    %text-shadow {
        text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
    }

    $header-font-size: 3em;

    h1, h2 {
        @extend %text-shadow;
        @include no-select();
    }

    h1 {
        text-align: center;
        font-size: $header-font-size;
        margin: .67em 0;
        margin-bottom: 0;

        > a {
            text-shadow: none;
        }
    }

    h2 {
        font-size: #{$header-font-size * .8};
        margin-top: 0;
        color: #ffffff;
    }
</style>

<template>
    <div>
        <h1>
            Search threads
        </h1>
        <ThreadBacklinks
            :back-link="{ name: 'Boards' }"
            :external-href="externalHref"
        />
        <br>
        <form @submit.prevent="doSearch">
            <label>
                Query:
                <input
                    v-model="form.query"
                    v-focus
                    type="text"
                    :disabled="loading"
                >
            </label>
            <label>
                Board:
                <select
                    v-model="form.board"
                    :disabled="loading"
                >
                    <option
                        v-for="b in shownBoards"
                        :key="b.board"
                        :value="b.board"
                    >{{ b.board }} - {{ b.title }}
                    </option>
                    <option value="">ALL</option>
                </select>
            </label>
            <label>
                Show NSFW:
                <input
                    v-model="form.nsfw"
                    type="checkbox"
                >
            </label>
            <input
                type="submit"
                value="Search"
                :disabled="loading || form.query.length < 3"
                @click.prevent="doSearch"
            >
        </form>
        <LoaderSpinner
            v-if="loading"
            size="20px"
        />
        <progress
            v-if="loading"
            :value="progress.value"
            :max="progress.max"
        />
        <LoaderSpinner
            v-if="loading"
            size="20px"
        />
        <div class="container">
            <BoardThread
                v-for="thread in results"
                :key="thread.item.id"
                :thread="thread.item"
            />
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import ThreadBacklinks from '../components/ThreadBacklinks';
    import BoardThread from '../components/threads/Thread';
    import PepeImage from '../assets/images/pepe.png';
    import LoaderSpinner from '../components/threads/thread/media/LoaderSpinner';

    function e(name, content) {
        return { hid: name, name, content };
    }

    export default {
        name: 'Search',

        components: { ThreadBacklinks, BoardThread, LoaderSpinner },

        head() {
            return {
                title: 'Search',
                meta: [
                    e('og:title', 'Search | ThreadPuller'),
                    e('og:description', 'Search the current boards.'),
                    e('description', 'Search the current boards.'),
                    e('og:image', PepeImage),
                ],
            };
        },

        data() {
            return {
                form: {
                    board: '',
                    query: '',
                    nsfw: true,
                },
                progress: {
                    value: 0,
                    max: 0,
                },
                loading: false,
                results: [],
            };
        },

        computed: {
            shownBoards() {
                if (this.form.nsfw) {
                    return this.boards;
                }

                return this.boards.filter(({ nsfw }) => !nsfw);
            },

            externalHref() {
                return `https://find.4channel.org/?q=${ encodeURIComponent(this.form.query) }`;
            },

            ...mapGetters({
                'boards': 'boards/get',
            }),
        },

        async fetch({ store }) {
            const isServer = process.server;

            await store.dispatch('boards/fetch', { isServer });
        },

        methods: {
            async * makeTextFileLineIterator(response) {
                const utf8Decoder = new TextDecoder('utf-8');
                const reader = response.body.getReader();
                let { value: chunk, done: readerDone } = await reader.read();
                chunk = chunk ? utf8Decoder.decode(chunk) : '';

                const re = /\n|\r|\r\n/gm;
                let startIndex = 0;
                let result;

                for (; ;) {
                    result = re.exec(chunk);
                    if (!result) {
                        if (readerDone) {
                            break;
                        }
                        const remainder = chunk.substr(startIndex);
                        ({ value: chunk, done: readerDone } = await reader.read());
                        chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
                        re.lastIndex = 0;
                        startIndex = 0;
                        continue;
                    }
                    yield chunk.substring(startIndex, result.index);
                    startIndex = re.lastIndex;
                }
                if (startIndex < chunk.length) {
                    // last line didn't end in a newline char
                    yield chunk.substr(startIndex);
                }
            },

            async doSearch() {
                if (this.loading) {
                    return;
                }

                if (!this.form.query) {
                    return;
                }

                this.loading = true;
                this.$set(this, 'results', []);

                const result = await fetch('/api/search/local', {
                    method: 'POST',
                    body: JSON.stringify(this.form),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                for await(const line of this.makeTextFileLineIterator(result)) {
                    const { threads, results, total } = JSON.parse(line);

                    this.progress.value = results;
                    this.progress.max = total;

                    const newResults = [ ...this.results, ...threads ].sort(({ score: a }, { score: b }) => a - b);

                    this.$set(this, 'results', newResults);
                }

                this.loading = false;
                this.progress.value = 0;
                this.progress.max = 1;
            },
        },
    };
</script>
