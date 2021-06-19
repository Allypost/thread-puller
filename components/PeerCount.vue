<template>
  <div
    v-if="show"
    :class="$style.peers"
  >
    <span class="title">P: </span><span class="count">{{ peers }}</span><span :class="$style.helpText"> {{ helpText }}</span>
  </div>
</template>

<script>
  export default {
    name: 'PeerCount',

    props: {
      socket: {
        type: Object,
        required: true,
      },
    },

    data() {
      return {
        peers: 0,
      };
    },

    computed: {

      show() {
        return Boolean(this.peers);
      },

      helpText() {
        if (1 < this.peers) {
          return 'other users on this page';
        } else {
          return 'other user on this page';
        }
      },

    },

    mounted() {
      this.socket.on('event:peers:page:count', (peers) => {
        this.peers = peers - 1;
      });
    },
  };
</script>

<style lang="scss" module>
  @import "../assets/style/modules/include";

  .helpText {
    display: none;
  }

  .peers {
    font-weight: bold;
    position: fixed;
    z-index: 9;
    bottom: 0;
    left: 0;
    display: inline-block;
    padding: .2em .6em;
    border-top-right-radius: 5px;
    background: $background-color;

    @include no-select();

    &:hover {

      .helpText {
        display: inline;
      }

    }
  }
</style>
