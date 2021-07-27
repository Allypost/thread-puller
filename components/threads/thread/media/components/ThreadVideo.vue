<template>
  <video
    :autoplay="vAutoplay"
    :controls="controls"
    :loop="vLoop"
    :preload="preload"
  >
    <source :src="srcset.remote">
    <source :src="srcset.local">
    Your browser does not support the video tag.
  </video>
</template>

<script>
  import {
    mapState,
  } from 'vuex';

  export default {
    name: 'ThreadVideo',

    props: {
      file: {
        type: Object,
        required: true,
      },
      autoplay: {
        type: Boolean,
        default: null,
      },
      controls: {
        type: Boolean,
        default: true,
      },
      volume: {
        type: Number,
        default: null,
      },
      preload: {
        type: String,
        default: 'metadata',
      },
      loop: {
        type: Boolean,
        default: null,
      },
    },

    data() {
      return {
        isDestroyed: false,
      };
    },

    computed: {
      srcset() {
        const { src } = this.file;
        const { local, remote } = src;

        return {
          local: local.full,
          remote: remote.full,
        };
      },

      vAutoplay() {
        if (null === this.autoplay) {
          return false;
        } else {
          return this.autoplay;
        }
      },

      ...mapState('settings', {
        vVolume({ volume }) {
          if (this.isDestroyed) {
            return 0;
          }

          return this.getValue(volume, 'volume');
        },

        /*
         // Disabled for now
         vAutoplay({ autoplay }) {
         return this.getValue(autoplay, 'autoplay');
         },
         */

        vLoop({ loop }) {
          return this.getValue(loop, 'loop');
        },
      }),
    },

    watch: {
      vVolume(newValue) {
        this.setVolume(newValue);
      },

      vAutoplay(newValue) {
        if (true === newValue) {
          this.$el.play();
        }
      },
    },

    mounted() {
      this.setVolume(this.vVolume);
    },

    beforeDestroy() {
      this.setVolume(0);
      this.isDestroyed = true;
    },

    methods: {
      setVolume(newVolume) {
        if (1 < newVolume) {
          newVolume /= 100;
        }

        this.$el.volume = newVolume;
      },

      getValue(setting, key) {
        if (null !== this[ key ]) {
          return this[ key ];
        }

        const { value } = setting;

        return value;
      },
    },
  };
</script>

<style>
  video {
    width: 100%;
  }
</style>
