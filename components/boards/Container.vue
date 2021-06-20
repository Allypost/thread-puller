<template>
  <div>
    <SearchInput
      :data="rawBoards"
      :keys="keys"
      @updateData="filteredBoards = arguments[0]"
      @updateQuery="updateQuery"
    />
    <div class="container">
      <board-entry
        v-for="board of boards"
        :key="board.board"
        :board="board"
      />
    </div>
  </div>
</template>

<script>
  import {
    mapGetters,
  } from 'vuex';
  import SearchInput from '../SearchInput';
  import BoardEntry from './Board';

  export default {
    name: 'Container',

    components: { SearchInput, BoardEntry },

    data() {
      return {
        filteredBoards: null,
        keys: [
          {
            name: 'description',
            weight: 0.50,
          },
          {
            name: 'title',
            weight: 0.40,
          },
          {
            name: 'board',
            weight: 0.10,
          },
        ],
      };
    },

    computed: {
      boards() {
        return this.filteredBoards || this.rawBoards;
      },

      ...mapGetters({
        rawBoards: 'boards/get',
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
  }
</style>
