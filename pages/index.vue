<template>
  <div class="container">
    <h1>
      ThreadPuller - Pull 4chan image threads
    </h1>
    <h2>
      Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.
    </h2>
    <boards-container />
  </div>
</template>

<router>
name: Boards
</router>

<script>
  import PepeImage from '../assets/images/pepe.png';
  import BoardsContainer from '../components/boards/BoardContainer';
  import {
    generateMetadata,
  } from '../lib/Helpers/Head/metadata';

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Boards',

    components: { BoardsContainer },

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
  };
</script>

<style lang="scss" scoped>
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
</style>
