<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  %text-shadow {
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
  }

  h1, h2 {
    @extend %text-shadow;
    @include no-select();
  }

  h1 {
    font-size: 3em;
    margin: .67em 0;
    text-align: center;

    > a {
      text-shadow: none;
    }
  }

  h2 {
    margin-top: -.5em;
    margin-bottom: 1.2em;
  }
</style>

<template>
  <div>
    <threadpuller-settings />
    <thread-backlinks
      :back-link="{ name: 'Boards' }"
      :external-href="externalHref"
    />
    <h1>Board: {{ board.link }}</h1>
    <h2 v-html="board.description" />

    <threads-container />
  </div>
</template>

<script>
  import {
    AllHtmlEntities as HTMLEntities,
  } from 'html-entities';
  import {
    mapGetters,
  } from 'vuex';
  import PepeImage from '../../assets/images/pepe.png';
  import ThreadBacklinks from '../../components/ThreadBacklinks';
  import ThreadpullerSettings from '../../components/settings/Container.vue';
  import ThreadsContainer from '../../components/threads/Container';

  function getBoard(store, boardName) {
    return store.getters[ 'boards/getOne' ](boardName);
  }

  async function fetchBoard(store, { isServer, boardName, cached = false }) {
    const board = getBoard(store, boardName);

    if (board && cached) {
      return board;
    }

    await store.dispatch('boards/fetchOne', { isServer, boardName });

    return getBoard(store, boardName);
  }

  async function boardExists(store, { isServer, boardName, cached = true }) {
    const board = await fetchBoard(store, { isServer, boardName, cached });

    return Boolean(board);
  }

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Threads',

    async validate({ params, store }) {
      const { board: boardName } = params;
      const isServer = process.server;

      return await boardExists(store, { boardName, isServer });
    },

    components: { ThreadsContainer, ThreadBacklinks, ThreadpullerSettings },

    async fetch({ store, params }) {
      const { board: boardName } = params;
      const isServer = process.server;

      await fetchBoard(store, { boardName, isServer });

      await store.dispatch('threads/fetch', { isServer, boardName });
    },

    computed: {
      boardName() {
        //noinspection JSUnresolvedVariable
        const { params } = this.$route;
        const { board } = params;

        return board;
      },

      externalHref() {
        return `https://boards.4chan.org/${ this.boardName }/`;
      },

      board() {
        return this.getBoard(this.boardName);
      },

      ...mapGetters({
        getBoard: 'boards/getOne',
      }),
    },

    methods: {
      decodeEntities(text) {
        const htmlEntities = new HTMLEntities();
        return htmlEntities.decode(text);
      },
    },

    head() {
      const { link, title, description } = this.board;

      const decodedDescription = this.decodeEntities(description);

      return {
        title: link,
        meta: [
          e('og:title', `${ link } - ${ title } | ThreadPuller`),
          e('og:description', decodedDescription),
          e('description', decodedDescription),
          e('og:image', PepeImage),
        ],
      };
    },

  };
</script>
