<template>
  <thread-video
    :file="file"
    :poster="poster"
    :preload="isVisible ? 'auto' : 'metadata'"
  />
</template>

<script>
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
        isVisible: false,
        thumbSrc: '',
      };
    },

    computed: {

      posterSrcSet() {
        const { src } = this.file;
        const { local, remote } = src;
        const { thumb: localThumb, thumbHD: localThumbHD } = local;
        const { thumb: remoteThumb } = remote;

        return {
          local: localThumb,
          remote: remoteThumb,
          hd: localThumbHD,
        };
      },

      poster() {
        if (!this.isVisible) {
          return this.thumbSrc;
        }

        const { hd } = this.posterSrcSet;

        return hd;
      },

    },

    mounted() {
      this.listener = () => {
        if (!isElementInViewport(this.$el)) {
          return;
        }

        this.isVisible = true;
        window.removeEventListener('scroll', this.listener);
      };

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
        const { remote, local } = this.posterSrcSet;

        img.src = remote;

        img.onerror = () => {
          if (!this.isVisible) {
            this.thumbSrc = local;
          }
        };

        img.onload = () => {
          if (!this.isVisible) {
            this.thumbSrc = remote;
          }
        };
      },
    },

  };
</script>
