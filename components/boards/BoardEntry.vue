<template>
  <article
    :data-nsfw="board.nsfw"
    class="board"
  >
    <header>
      <n-link
        ref="link"
        :event="approved ? 'click' : ''"
        :to="{ name: 'Threads', params: { board: board.board } }"
        class="title"
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

<style lang="scss" scoped>
  @use "sass:math";

  @import "../../assets/style/modules/include";

  .board {
    font-size: 1.4em;
    position: relative;
    display: grid;
    padding: .5em;
    border-radius: 4px;
    background-color: $board-background-color;
    grid-row-gap: .3em;

    &::after {
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: "";
      transition: opacity .3s #{$transition-smooth};
      opacity: 0;
      border-radius: inherit;
      box-shadow: 0 4px 5px 0 rgba(0, 0, 0, .24), 0 1px 10px 0 rgba(0, 0, 0, .22), 0 2px 4px -1px rgba(0, 0, 0, .4);
    }
  }

  .title {
    font-size: 1.3em;
    font-weight: 700;
    display: inline-block;
    margin: 0;
    text-align: center;
    text-decoration: underline;
    color: invert($text-color);

    &:hover {
      text-decoration: none;
    }
  }

  .description {
    position: relative;
    display: block;
    overflow: hidden;
    padding: .35em .5em;
    text-align: center;
    border-radius: 4px;
    background: rgba(0, 0, 0, .6);
  }

  .board[data-nsfw] {
    background-color: adjust-color($nsfw-color, $lightness: math.div(lightness($board-background-color), 2));

    header::before {
      font-size: .8em;
      position: relative;
      bottom: 3px;
      display: inline-block;
      margin-right: .5em;
      padding: .2em .4em;
      content: "NSFW";
      color: $text-color;
      border-radius: 4px;
      background: $nsfw-color;
      text-shadow: 1px 1px 1px invert($text-color);
    }
  }
</style>
