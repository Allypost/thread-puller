<template>
  <div :class="$style.container">
    <threadpuller-settings />
    <thread-backlinks
      :back-link="{ name: 'Boards' }"
      :external-href="externalHref"
    />
    <h1>Board: {{ board.link }}</h1>
    <h2 v-html="board.description" />

    <SearchInput
      :data="rawThreads"
      :keys="keys"
      @updateData="filteredThreads = arguments[0]"
      @updateQuery="updateQuery"
    />

    <client-only>
      <div :class="$style.sortContainer">
        <label>
          Sort posts by
          <select v-model="sort.key">
            <option
              selected
              value="none"
            >
              none
            </option>
            <option value="images">image #</option>
            <option value="replies">reply #</option>
          </select>
          <select
            v-if="sort.key !== 'none'"
            v-model="sort.direction"
          >
            <option value="desc">&darr;</option>
            <option value="asc">&uarr;</option>
          </select>
        </label>
      </div>
    </client-only>

    <div :class="$style.threadsContainer">
      <board-thread
        v-for="thread in sortedThreads"
        :key="thread.id"
        :thread="thread"
      />
    </div>
  </div>
</template>

<router>
name: Threads
</router>

<script>
  import {
    decode as decodeHtmlEntities,
  } from 'html-entities';
  import {
    mapGetters,
  } from 'vuex';
  import PepeImage from '../../assets/images/pepe.png';
  import SearchInput from '../../components/SearchInput';
  import ThreadBacklinks from '../../components/ThreadBacklinks';
  import ThreadpullerSettings from '../../components/settings/ThreadpullerSettings.vue';
  import BoardThread from '../../components/threads/BoardThread';
  import {
    generateMetadata,
  } from '../../lib/Helpers/Head/metadata';

  export default {
    name: 'Threads',

    components: {
      SearchInput,
      BoardThread,
      ThreadBacklinks,
      ThreadpullerSettings,
    },

    data() {
      const {
        sb = 'none',
        sd = 'desc',
      } = this.$route.query;

      const allowedSortKeys = new Set([
        'none',
        'images',
        'replies',
      ]);

      const allowedSortDirections = new Set([
        'asd',
        'desc',
      ]);

      return {
        filteredThreads: null,
        sort: {
          key: allowedSortKeys.has(sb) ? sb : 'none',
          direction: allowedSortDirections.has(sd) ? sd : 'desc',
        },
        keys: [
          {
            name: 'body.title',
            weight: 0.50,
          },
          {
            name: 'body.content',
            weight: 0.40,
          },
          {
            name: 'file.name',
            weight: 0.10,
          },
        ],
      };
    },

    async fetch({
      params,
      store,
      error,
    }) {
      const { board: boardName } = params;

      await Promise.all([
        store.dispatch('boards/fetchOne', { boardName }),
        store.dispatch('threads/fetch', { boardName }),
      ]);

      if (!store.getters[ 'boards/board' ]) {
        error({
          statusCode: 404,
          message: 'Board does not exist',
        });
      }
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

      threads() {
        return this.filteredThreads || this.rawThreads;
      },

      sortedThreads() {
        const sortKey = this.sort.key;
        const sortDir = this.sort.direction;

        if ('none' === sortKey) {
          return this.threads;
        }

        const factor = 'asc' === sortDir ? 1 : -1;

        return (
          Array
            .from(this.threads)
            .sort(
              (a, b) =>
                (a.meta[ sortKey ] - b.meta[ sortKey ]) * factor,
            )
        );
      },

      ...mapGetters('threads', {
        rawThreads: 'threads',
      }),

      ...mapGetters('boards', {
        board: 'board',
      }),
    },

    watch: {
      sort: {
        deep: true,
        handler(newSort) {
          const {
            sb,
            sd,
            ...query
          } = this.$route.query;

          const {
            key,
            direction,
          } = newSort;

          if ('none' === key) {
            this.$router.replace({
              query,
            });
          } else {
            this.$router.replace({
              query: {
                ...query,
                sb: key,
                sd: direction,
              },
            });
          }
        },
      },
    },

    methods: {
      decodeEntities(text) {
        return decodeHtmlEntities(text);
      },

      updateQuery(action, data) {
        this.$router[ action ](data);
      },
    },

    head() {
      const {
        link,
        title,
        description,
      } = this.board;

      const decodedDescription = this.decodeEntities(description);

      return {
        title: link,
        meta: [
          ...generateMetadata({
            title: `${ link } - ${ title }`,
            description: decodedDescription,
            image: PepeImage,
          }),
        ],
      };
    },
  };
</script>

<style lang="scss" module>
  @import "../../assets/style/modules/include";

  %text-shadow {
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
  }

  .container {

    h1,
    h2 {
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
  }

  .threadsContainer {
    @extend %container-base;

    margin-top: 0;
  }

  .sortContainer {
    margin: 1em 1em .5em;
    text-align: right;

    select {
      font-size: 100%;
      padding: .2em .3em;
      color: $text-color;
      border-width: 1px;
      border-style: solid;
      border-color: currentColor;
      border-radius: 3px;
      background: none;
    }
  }
</style>
