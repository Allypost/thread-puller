<template>
  <app-max-width-container>
    <v-row class="mt-6">
      <v-col cols="12">
        <h1
          :class="$style.title"
          class="text-center text-h2"
        >
          ThreadPuller - Pull 4chan image threads
        </h1>
      </v-col>

      <v-col cols="12">
        <h2
          :class="$style.title"
          class="text-center text-h4"
        >
          Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.
        </h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="board in boards"
        :key="board.board"
        cols="12"
        lg="4"
        xl="3"
        xs="6"
      >
        <v-card
          :class="{
            [$style.card]: true,

            'red': board.nsfw,
            'lighten-3': !$vuetify.theme.dark,
            'darken-4': $vuetify.theme.dark,
          }"
          :to="{
            name: 'Threads',
            params: board,
          }"
          elevation="2"
        >
          <v-card-title v-text="board.link" />

          <v-card-subtitle v-text="board.title" />

          <v-card-text v-html="board.description" />
        </v-card>
      </v-col>
    </v-row>
  </app-max-width-container>
</template>

<router>
name: Boards
</router>

<script>
  import {
    mapGetters,
  } from 'vuex';
  import PepeImage from '~/assets/images/pepe.png';
  import AppMaxWidthContainer from '~/components/AppMaxWidthContainer';

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Boards',

    components: { AppMaxWidthContainer },

    async validate({ store }) {
      return await store.dispatch('boards/fetch');
    },

    computed: {
      ...mapGetters({
        'boards': 'boards/BOARDS',
      }),
    },

    head() {
      return {
        title: '',
        meta: [
          e('og:title', 'ThreadPuller - Pull 4Chan Image Threads'),
          e('og:description', 'Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.'),
          e('description', 'Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.'),
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
  }
</style>
