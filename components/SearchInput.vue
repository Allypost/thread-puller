<template>
  <client-only>
    <div :class="$style.container">
      <nuxt-link :class="$style.link" :to="{ name: 'Search' }">
        Advanced search
      </nuxt-link>
      <br>
      <label>
        Search:
        <input
          v-model="query"
          type="text"
        >
        <button
          :class="{ [$style.hidden]: !query.length }"
          :tabindex="-1 * !query.length"
          @click="query = ''"
        >
          Clear
        </button>
      </label>
    </div>
  </client-only>
</template>

<script>
  import {
    Fuse,
  } from '../lib/Search/Fuse';

  export default {
    name: 'SearchInput',

    props: {
      data: {
        type: Array,
        required: true,
      },
      keys: {
        type: Array,
        default() {
          return [];
        },
      },
    },

    data() {
      return {
        query: String(this.$route.query.q || ''),
      };
    },

    computed: {
      fuse() {
        return Fuse(this.data, this.keys);
      },
    },

    watch: {
      query(...args) {
        return this.updateQuery(...args);
      },

      '$route.query'({ q }) {
        /**
         * If the URL query isn't set or is empty
         * and the local query data is set,
         * clear the local query value.
         */
        if (!q && this.query) {
          this.query = '';
        }
      },
    },

    created() {
      this.updateData(this.query);
    },

    methods: {
      updateData(query) {
        const getData = (query) => {
          if (!query) {
            return null;
          }

          return (
            this
              .fuse
              .search(query)
              .map(({ item }) => item)
          );
        };

        this.$emit(
          'updateData',
          getData(query),
        );
      },

      updateQuery(newValue) {
        const {
          q,
          ...query
        } = this.$route.query;

        this.updateData(newValue);

        /*
         * If the query value is empty, but there exists an URL query parameter value.
         * That means that we should remove the URL query parameter.
         */
        if (!newValue && q) {
          return this.$emit('updateQuery', 'replace', { query });
        }

        const route = {
          query: {
            q: newValue,
            ...query,
          },
        };

        /**
         * If a query was already set, replace it in the history
         */
        if (q) {
          return this.$emit('updateQuery', 'replace', route);
        }

        /**
         * Add a query parameter to the URL if a query exists
         */
        if (newValue) {
          return this.$emit('updateQuery', 'push', route);
        }
      },
    },
  };
</script>

<style lang="scss" module>
  @import "../assets/style/modules/include";

  .hidden {
    @include no-select();

    opacity: 0;
  }

  .link {
    @extend %link;
  }

  .container {

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

    input {
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

    button {
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

      &:hover {
        background-color: darken($post-background-color, 5%);
      }

      &:active {
        background-color: darken($post-background-color, 15%);
      }
    }
  }
</style>
