<template>
  <div>
    <SearchInput
      :data="rawThreads"
      :keys="keys"
      @updateData="filteredThreads = arguments[0]"
      @updateQuery="updateQuery"
    />
    <client-only>
      <div class="sort-container">
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
    <div class="container">
      <board-thread
        v-for="thread in sortedThreads"
        :key="thread.id"
        :thread="thread"
      />
    </div>
  </div>
</template>

<script>
  import {
    mapGetters,
  } from 'vuex';
  import SearchInput from '../SearchInput';
  import BoardThread from './BoardThread';

  export default {
    name: 'ThreadsContainer',

    components: { SearchInput, BoardThread },

    data() {
      return {
        filteredThreads: null,
        sort: {
          key: 'none',
          direction: 'desc',
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

    computed: {
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
    },

    methods: {
      updateQuery(action, data) {
        this.$router[ action ](data);
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  .container {
    @extend %container-base;

    margin-top: 0;
  }

  .sort-container {
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
