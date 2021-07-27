<template>
  <article
    :id="id"
    class="board"
  >
    <thread-header :thread="thread" />
    <thread-content :thread="thread" />
    <footer>
      <span>{{ thread.meta.images }} images | {{ thread.meta.replies }} replies <span v-if="showBoardName">| /{{ thread.board }}/</span></span>
    </footer>
  </article>
</template>

<script>
  import constant from 'lodash/fp/constant';
  import ThreadContent from './thread/ThreadContent';
  import ThreadHeader from './thread/ThreadHeader';

  export default {
    name: 'BoardThread',

    components: { ThreadContent, ThreadHeader },

    props: {
      thread: {
        type: Object,
        required: true,
      },
      showBoardName: {
        type: Boolean,
        required: false,
        default: constant(false),
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

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  .board {
    font-size: 1.4em;
    display: grid;
    padding: .5em;
    border-radius: 4px;
    background-color: $board-background-color;
    grid-template-rows: auto 1fr 1.5em;
  }

  footer {
    font-size: .8em;
    display: grid;
    align-items: center;
    border-radius: 0 0 6px 6px;
    background-color: $board-footer-background-color;
  }
</style>
