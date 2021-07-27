<template>
  <thread-video
    v-if="isVisible"
    :data-is-visible="isVisible ? 'yes' : 'no'"
    :file="file"
    :poster="poster"
    :preload="wasVisible ? 'auto' : 'metadata'"
  />
  <div
    v-else
    :class="{
      [$style.placeholderPoster]: true,
      [$style.blur]: !wasVisible,
    }"
    :style="`padding-bottom: ${aspectRatio * 100}%; background-image: url('${poster}')`"
  />
</template>

<script>
  import {
    throttle,
  } from 'lodash/fp';
  import ThreadVideo from '../../../threads/thread/media/components/ThreadVideo.vue';

  function isElementInViewport(el) {
    const scroll = window.scrollY || window.pageYOffset;
    const boundsTop = el.getBoundingClientRect().top + scroll;

    const viewport = {
      top: scroll,
      bottom: scroll + window.innerHeight,
    };

    const bounds = {
      top: boundsTop,
      bottom: boundsTop + el.clientHeight,
    };

    return (
      (
        bounds.bottom >= viewport.top && bounds.bottom <= viewport.bottom
      )
      || (
        bounds.top <= viewport.bottom && bounds.top >= viewport.top
      )
    );
  }

  export default {
    name: 'PostVideo',

    components: { ThreadVideo },

    props: {
      file: {
        type: Object,
        required: true,
      },
    },

    data() {
      return {
        wasVisible: false,
        isVisible: false,
        thumbSrc: '',
      };
    },

    computed: {

      aspectRatio() {
        const {
          width,
          height,
        } = this.file.dimensions.main;

        return height / width;
      },

      posterSrcSet() {
        const { src } = this.file;
        const {
          local,
          remote,
        } = src;
        const {
          thumb: localThumb,
          thumbHD: localThumbHD,
        } = local;
        const { thumb: remoteThumb } = remote;

        return {
          local: localThumb,
          remote: remoteThumb,
          hd: localThumbHD,
        };
      },

      poster() {
        if (!this.wasVisible) {
          return this.thumbSrc;
        }

        const { hd } = this.posterSrcSet;

        return hd;
      },

    },

    mounted() {
      const throttleForMs = 200;

      this.listener =
        throttle(
          throttleForMs,
          () => {
            const isVisible = isElementInViewport(this.$el);

            if (isVisible) {
              this.wasVisible = true;
            }

            this.isVisible = isVisible;
          },
        );

      window.addEventListener('scroll', this.listener);
      this.listener();

      this.computePoster();
    },

    beforeDestroy() {
      window.removeEventListener('scroll', this.listener);
    },

    methods: {
      computePoster() {
        const img = new Image();
        const {
          remote,
          local,
        } = this.posterSrcSet;

        img.src = remote;

        img.onerror = () => {
          if (!this.wasVisible) {
            this.thumbSrc = local;
          }
        };

        img.onload = () => {
          if (!this.wasVisible) {
            this.thumbSrc = remote;
          }
        };
      },
    },

  };
</script>

<style lang="scss" module>
  .placeholderPoster {
    transition: filter 1s ease;
    background-position: center;
    background-size: contain;
    filter: blur(0);
    will-change: filter;
  }

  .blur {
    filter: blur(3px);
  }
</style>
