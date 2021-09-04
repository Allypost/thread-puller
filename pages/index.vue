<template>
  <div :class="$style.container">
    <h1>
      ThreadPuller - Pull 4chan image threads
    </h1>

    <h2>
      Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.
    </h2>

    <SearchInput
      :data="rawBoards"
      :keys="[
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
      ]"
      @updateData="filteredBoards = arguments[0]"
      @updateQuery="updateQuery"
    />

    <div :class="$style.boardsContainer">
      <article
        v-for="board of boards"
        :key="board.board"
        :class="$style.board"
        :data-nsfw="board.nsfw"
      >
        <header>
          <nuxt-link
            ref="link"
            :class="$style.boardTitle"
            :to="{ name: 'Threads', params: { board: board.board } }"
            @click.native.capture="handleClick($event, board)"
          >
            {{ board.link }} - {{ board.title }}
          </nuxt-link>
        </header>

        <section
          :class="$style.boardDescription"
          v-html="board.description"
        />
      </article>
    </div>
  </div>
</template>

<router>
name: Boards
</router>

<script>
  import {
    mapGetters,
  } from 'vuex';
  import PepeImage from '../assets/images/pepe.png';
  import SearchInput from '../components/SearchInput';
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
    name: 'Boards',

    components: {
      SearchInput,
    },

    data() {
      return {
        filteredBoards: null,
      };
    },

    async fetch({ store }) {
      await store.dispatch('boards/fetchAll');
    },

    head() {
      const title = 'ThreadPuller - Pull 4Chan Image Threads';

      return {
        title,
        meta: [
          ...generateMetadata({
            title,
            description: 'Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.',
            image: PepeImage,
          }),
        ],
      };
    },

    computed: {
      boards() {
        return this.filteredBoards || this.rawBoards;
      },

      ...mapGetters('boards', {
        rawBoards: 'boards',
      }),
    },

    methods: {
      updateQuery(action, data) {
        this.$router[ action ](data);
      },

      handleClick($event, board) {
        if (!board.nsfw) {
          return true;
        }

        const allowClick = window.confirm(
          'This section of the website may contain sexually explicit content or content that is otherwise inappropriate for children and young adults.'
            + '\nIf you are a minor or it is illegal for you to access mature images and language, do not proceed.'
            + '\n\nYou must be 18 or older to enter.'
            + '\n\nDo you agree to continue?'
          ,
        );

        if (!allowClick) {
          $event.preventDefault();
        }
      },
    },
  };
</script>

<style lang="scss" module>
  @use "sass:math";

  @import "../assets/style/modules/include";

  .container {

    > h1,
    > h2 {
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 1), 0 0 5px #000000, 3px 3px 8px #000000;

      a {
        text-shadow: none;
      }

      @include no-select();
    }

    > h1 + h2 {
      margin-top: -.5em;
      margin-bottom: 1.2em;
    }
  }

  .boardsContainer {
    @extend %container-base;
  }

  .board {
    font-size: 1.4em;
    position: relative;
    display: grid;
    padding: .5em;
    border-radius: 4px;
    background-color: $board-background-color;
    grid-row-gap: .3em;

    &::after {
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: "";
      transition: opacity .3s #{$transition-smooth};
      opacity: 0;
      border-radius: inherit;
      box-shadow: 0 4px 5px 0 rgba(0, 0, 0, .24), 0 1px 10px 0 rgba(0, 0, 0, .22), 0 2px 4px -1px rgba(0, 0, 0, .4);
    }

    &[data-nsfw] {
      background-color: adjust-color($nsfw-color, $lightness: math.div(lightness($board-background-color), 2));

      header::before {
        font-size: .8em;
        position: relative;
        bottom: 3px;
        display: inline-block;
        margin-right: .5em;
        padding: .2em .4em;
        content: "NSFW";
        color: $text-color;
        border-radius: 4px;
        background: $nsfw-color;
        text-shadow: 1px 1px 1px invert($text-color);
      }
    }
  }

  .boardTitle {
    @extend %link;

    font-size: 1.3em;
    font-weight: 700;
    display: inline-block;
    margin: 0;
    text-align: center;
    color: invert($text-color);
  }

  .boardDescription {
    position: relative;
    display: block;
    overflow: hidden;
    padding: .35em .5em;
    text-align: center;
    border-radius: 4px;
    background: rgba(0, 0, 0, .6);
  }
</style>
