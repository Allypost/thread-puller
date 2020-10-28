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
          :disabled="loading"
          type="text"
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
        :disabled="loading || form.query.length < 3"
        type="submit"
        value="Search"
        @click.prevent="doSearch"
      >
    </form>
    <LoaderSpinner
      v-if="loading"
      size="20px"
    />
    <progress
      v-if="loading"
      :max="progress.max"
      :value="progress.value"
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
        show-board-name
      />
    </div>
  </div>
</template>

<script>
  import {
    mapActions,
    mapGetters,
  } from 'vuex';
  import PepeImage from '../assets/images/pepe.png';
  import ThreadBacklinks from '../components/ThreadBacklinks';
  import BoardThread from '../components/threads/Thread';
  import LoaderSpinner from '../components/threads/thread/media/LoaderSpinner';

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Search',

    components: { ThreadBacklinks, BoardThread, LoaderSpinner },

    async fetch({ store }) {
      const isServer = process.server;

      await store.dispatch('boards/fetch', { isServer });
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

    methods: {
      ...mapActions({
        'searchThreads': 'search/searchThreads',
      }),

      async doSearch() {
        if (this.loading) {
          return;
        }

        if (!this.form.query) {
          return;
        }

        this.loading = true;
        this.$set(this, 'results', []);

        const isServer = process.server;
        const result = await this.searchThreads({ ...this.form, isServer });

        this.$set(this, 'results', result);

        this.loading = false;
        this.progress.value = 0;
        this.progress.max = 1;
      },
    },

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
  };
</script>

<style lang="scss" scoped>
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
    font-size: $header-font-size;
    margin: .67em 0;
    margin-bottom: 0;
    text-align: center;

    > a {
      text-shadow: none;
    }
  }

  h2 {
    font-size: #{$header-font-size * .8};
    margin-top: 0;
    color: $text-color;
  }
</style>
