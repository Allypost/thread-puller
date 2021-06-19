<template>
  <app-max-width-container>
    <v-row class="mt-6">
      <v-col cols="12">
        <h1
          :class="$style.title"
          class="text-center text-h2"
        >
          Board: {{ board.link }}
        </h1>
      </v-col>

      <v-col cols="12">
        <h2
          :class="$style.title"
          class="text-center text-h4"
          v-html="board.description"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="thread in threads"
        :key="thread.id"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        class="d-flex"
      >
        <client-only>
          <thread-card
            class="flex-grow-1"
            :thread="thread"
          />
        </client-only>
      </v-col>
    </v-row>
  </app-max-width-container>
</template>

<router>
name: Threads
</router>

<script>
  import {
    AllHtmlEntities as HTMLEntities,
  } from 'html-entities';
  import {
    mapGetters,
  } from 'vuex';
  import PepeImage from '~/assets/images/pepe.png';
  import AppMaxWidthContainer from '~/components/AppMaxWidthContainer';
  import ThreadCard from '~/components/threads/ThreadCard';

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Threads',

    async validate({ params, store }) {
      const { board: boardName } = params;

      return (
        await store.dispatch('boards/fetchOne', { boardName })
        && await store.dispatch('threads/fetch', { boardName })
      );
    },

    components: {
      ThreadCard,
      AppMaxWidthContainer,
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

      ...mapGetters({
        board: 'boards/BOARD',
        threads: 'threads/THREADS',
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

<style lang="scss" module>
  @import "assets/style/modules/include";

  .title {
    @include no-select();
  }

  .card {
    height: 100%;

    .cardText {
      display: inline-block;
      overflow: hidden;
      max-height: 80px;
      text-overflow: ellipsis;
    }
  }
</style>
