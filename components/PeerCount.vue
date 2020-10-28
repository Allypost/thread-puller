<template>
  <div
    :class="{ show }"
    class="peers"
  >
    <span class="title">P: </span><span class="count">{{ peers }}</span><span class="help-text"> {{ helpText }}</span>
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

<style lang="scss" scoped>
  @import "../assets/style/modules/include";

  .peers {
    font-weight: bold;
    position: fixed;
    bottom: 0;
    left: 0;
    display: none;
    padding: .2em .6em;
    border-top-right-radius: 5px;
    background: $background-color;

    @include no-select();

    &.show {
      display: inline-block;
    }

    .help-text {
      display: none;
    }

    &:hover {

      .help-text {
        display: inline;
      }

    }
  }
</style>
