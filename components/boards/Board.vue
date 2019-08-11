<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .board {
        position: relative;
        display: grid;
        grid-row-gap: .3em;
        padding: .5em;
        font-size: 1.4em;
        border-radius: 4px;
        background-color: $board-background-color;

        &::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
            width: 100%;
            height: 100%;
            border-radius: inherit;
            box-shadow: 0 4px 5px 0 rgba(0, 0, 0, .24), 0 1px 10px 0 rgba(0, 0, 0, .22), 0 2px 4px -1px rgba(0, 0, 0, .4);
            transition: opacity .3s #{$transition-smooth};
            opacity: 0;
        }

    }

    .title {
        display: inline-block;
        font-size: 1.3em;
        margin: 0;
        text-align: center;
        font-weight: 700;
        text-decoration: underline;
        color: #212121;

        &:hover {
            text-decoration: none;
        }
    }

    .description {
        position: relative;
        display: block;
        overflow: hidden;
        padding: .35em .5em;
        border-radius: 4px;
        background: rgba(0, 0, 0, .6);
        text-align: center;
    }


    .board[data-nsfw] {
        background-color: #ff9e9e;

        header::before {
            display: inline-block;
            content: "NSFW";
            font-size: .8em;
            position: relative;
            margin-right: .5em;
            padding: .2em .4em;
            border-radius: 4px;
            bottom: 3px;
            color: #ffffff;
            text-shadow: 1px 1px 1px #000000;
            background: #e53935;
        }

    }
</style>

<template>
    <article
        class="board"
        :data-nsfw="board.nsfw"
    >
        <header>
            <n-link
                ref="link"
                :to="board.link"
                class="title"
                :event="approved ? 'click' : ''"
                @click.native="handleClick"
            >
                {{ board.link }} - {{ board.title }}
            </n-link>
        </header>
        <section
            class="description"
            v-html="board.description"
        />
    </article>
</template>

<script>
    export default {
        name: 'BoardEntry',

        props: {
            board: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                approved: !this.board.nsfw,
            };
        },

        methods: {
            handleClick() {
                if (this.approved) {
                    return true;
                }

                this.approved = window.confirm(
                    'This section of the website may contain sexually explicit content or content that is otherwise inappropriate for children and young adults.\nIf you are a minor or it is illegal for you to access mature images and language, do not proceed.\n\nYou must be 18 or older to enter.\n\nDo you agree to continue?',
                );

                if (this.approved) {
                    this.$nextTick(() => this.$refs.link.$el.click());
                }
            },
        },
    };
</script>
