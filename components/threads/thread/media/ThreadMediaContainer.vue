<template>
  <section
    :class="{
      [$style.container]: true,
      [$style.containerExpanded]: expanded,
    }"
    @click="expanded = !expanded"
  >
    <thread-video
      v-if="expanded && isVideo"
      :autoplay="true"
      :file="file"
    />

    <thread-image
      v-else
      :alt="file.name"
      :class="{
        [$style.img]: true,
        [$style.imgExpanded]: expanded,
      }"
      :src-set="srcset"
    />
  </section>
</template>

<script>
  import ThreadImage from './components/ThreadImage';
  import ThreadVideo from './components/ThreadVideo';

  export default {

    name: 'ThreadMediaContainer',

    components: {
      ThreadVideo,
      ThreadImage,
    },

    props: {
      file: {
        type: [ Object, null ],
        required: true,
      },
    },

    data() {
      return {
        expanded: false,
      };
    },

    computed: {
      isVideo() {
        return this.file.meta.isVideo;
      },

      thumbSrc() {
        const { src } = this.file;
        const {
          local,
          remote,
        } = src;

        return {
          local: local.thumb,
          remote: remote.thumb,
        };
      },

      fullSrc() {
        const { src } = this.file;
        const {
          local,
          remote,
        } = src;

        return {
          local: local.full,
          remote: remote.full,
        };
      },

      srcset() {
        if (this.expanded) {
          return this.fullSrc;
        } else {
          return this.thumbSrc;
        }
      },
    },

  };
</script>

<style lang="scss" module>
  .container {
    overflow: hidden;
    max-height: 140px;
  }

  .containerExpanded {
    max-height: initial;
  }

  .img {
    width: 100%;
    cursor: zoom-in;
  }

  .imgExpanded {
    cursor: zoom-out;
  }
</style>
