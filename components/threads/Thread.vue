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
    };
</script>
