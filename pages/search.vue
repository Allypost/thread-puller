<template>
  <div :class="$style.container">
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
    <div :class="$style.threadsContainer">
      <BoardThread
        v-for="thread in results"
        :key="thread.item.id"
        :thread="thread.item"
        show-board-name
      />
    </div>
  </div>
</template>

<router>
name: Search
</router>

<script>
  import {
    mapActions,
    mapGetters,
  } from 'vuex';
  import PepeImage from '../assets/images/pepe.png';
  import ThreadBacklinks from '../components/ThreadBacklinks';
  import BoardThread from '../components/threads/BoardThread';
  import LoaderSpinner from '../components/threads/thread/media/LoaderSpinner';
  import {
    generateMetadata,
  } from '../lib/Helpers/Head/metadata';

  function e(name, content) {
    return {
      hid: name,
      name,
      content,
    };
  }

  export default {
    name: 'Search',

    components: {
      ThreadBacklinks,
      BoardThread,
      LoaderSpinner,
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

    async fetch({ store }) {
      await store.dispatch('boards/fetchAll');
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

      ...mapGetters('boards', {
        boards: 'boards',
      }),
    },

    methods: {
      ...mapActions({
        searchThreads: 'search/searchThreads',
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

        const result = await this.searchThreads(this.form);

        this.$set(this, 'results', result);

        this.loading = false;
        this.progress.value = 0;
        this.progress.max = 1;
      },
    },

    head() {
      const title = 'Search';

      return {
        title,
        meta: [
          ...generateMetadata({
            title,
            description: 'Search the current boards.',
            image: PepeImage,
          }),
        ],
      };
    },
  };
</script>

<style lang="scss" module>
  @import "../assets/style/modules/include";

  %text-shadow {
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
  }

  .threadsContainer {
    @extend %container-base;
  }

  .container {
    $header-font-size: 3em;

    h1,
    h2 {
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

    select {
      font-size: 100%;
      padding: .2em .3em;
      cursor: pointer;
      color: $text-color;
      border-width: 1px;
      border-style: solid;
      border-color: currentColor;
      border-radius: 3px;
      outline-color: $quote-color;
      background-color: $background-color;

      &:active {
        border-bottom-color: transparent;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
      }

      option {
        color: $text-color;
        border-width: 1px;
        border-style: solid;
        border-color: currentColor;
        border-radius: 3px;
        background-color: $background-color;
      }
    }

    input[type="text"] {
      font-size: 1rem;
      padding: .2rem .3rem;
      cursor: text;
      color: $text-color;
      border-width: 1px;
      border-style: solid;
      border-color: currentColor;
      border-radius: 3px;
      outline-color: $quote-color;
      background-color: $background-color;
    }

    button,
    input[type="button"],
    input[type="submit"] {
      font-size: 1rem;
      padding: .3rem .5rem;
      cursor: pointer;
      color: $text-color;
      border-width: 1px;
      border-style: solid;
      border-color: currentColor;
      border-radius: 3px;
      outline-color: $quote-color;
      background-color: $post-background-color;
      box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .24), 0 3px 1px -2px rgba(0, 0, 0, .22), 0 1px 5px 0 rgba(0, 0, 0, .3);

      &:disabled {
        cursor: default;
        color: lighten(desaturate($post-background-color, 100%), 25%);
        background-color: desaturate($post-background-color, 100%);
      }

      &:not(:disabled) {

        &:hover {
          background-color: darken($post-background-color, 5%);
        }

        &:active {
          background-color: darken($post-background-color, 15%);
        }
      }
    }
  }
</style>
