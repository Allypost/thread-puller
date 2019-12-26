<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .board {
        display: grid;
        grid-template-rows: auto 1fr 1.5em;
        font-size: 1.4em;
        padding: .5em;
        border-radius: 4px;
        background-color: $board-background-color;
    }

    footer {
        display: grid;
        font-size: .8em;
        border-radius: 0 0 6px 6px;
        background-color: #5e5e5e;
        align-items: center;
    }
</style>

<template>
    <article
        :id="id"
        class="board"
    >
        <thread-header :thread="thread" />
        <thread-content :thread="thread" />
        <footer>
            <span>{{ thread.meta.images }} images | {{ thread.meta.replies }} replies</span>
        </footer>
    </article>
</template>

<script>
    import ThreadHeader from './thread/Header';
    import ThreadContent from './thread/Content';

    export default {
        name: 'BoardThread',

        components: { ThreadContent, ThreadHeader },

        props: {
            thread: {
                type: Object,
                required: true,
            },
        },

        computed: {
            id() {
                const { id } = this.thread;

                return `post-${ id }`;
            },
        },

        mounted() {
            const { hash = '' } = this.$route;

            if (hash.trim().length) {
                const
                    values =
                        hash
                            .trim()
                            .substring(1)
                            .split('&')
                            .map((el) => el.split('='))
                            .reduce(
                                (acc, [ k, v ]) => ({
                                    ...acc,
                                    [ decodeURIComponent(k) ]: decodeURIComponent(v),
                                }),
                                {},
                            );

                const { 'scroll-to': scrollTo } = values;

                if (scrollTo && Number(scrollTo) === this.thread.id) {
                    window.requestIdleCallback(
                        () => {
                            try {
                                const top = this.$el.documentOffsetTop() - (window.innerHeight / 2);
                                window.scrollTo(0, top);
                                // this.$el.scrollIntoView(false);
                                // eslint-disable-next-line no-empty
                            } catch {
                            }
                        },
                        {
                            timeout: 850,
                        },
                    );
                }
            }
        },
    };
</script>
