<style lang="scss" scoped>
    @import "./style/common";

    #container {
        $margin-size: 2em;

        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-column-gap: $margin-size;
        grid-row-gap: $margin-size;
        margin: $margin-size;
        justify-items: stretch;
        align-items: baseline;

        @media only screen and (max-width: 1650px) {
            grid-template-columns: repeat(3, 1fr);
        }

        @media #{$large-and-down} {
            grid-template-columns: repeat(2, 1fr);
        }

        @media #{$small-and-down} {
            grid-template-columns: repeat(1, 1fr);
        }

    }

    .thread {
        @extend %card-shadow;

        display: grid;
        font-size: 1.4em;
        padding: .5em;
        border-radius: 4px;
        background-color: $board-background-color;
        grid-template-rows: auto auto 1.5em;

        &.long {

            .description {
                cursor: zoom-in;
            }

        }

    }
</style>

<template>
    <div id="container">
        <article
                :id="`post-${thread.id}`"
                :key="thread.id"
                class="thread"
                v-for="thread of threads"
        >
            <thread-header
                    :thread-link="`/${board}/thread/${thread.thread}`"
                    :title="thread.body.title"
            />

            <thread-content
                    :content="thread.body.content"
                    :file="thread.file"
            />

            <thread-footer
                    :reply-count="thread.meta.replies"
                    :image-count="thread.meta.images"
            />
        </article>
    </div>
</template>

<script>
    import ThreadHeader from './components/thread-header';
    import ThreadContent from './components/thread-content';
    import ThreadFooter from './components/thread-footer';

    export default {
        components: { ThreadFooter, ThreadHeader, ThreadContent },

        props: {
            board: {
                type: String,
                required: true,
            },
            threads: {
                type: Array,
                required: true,
                default: [],
            },
        },
    };
</script>
