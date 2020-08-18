<style lang="scss" scoped>
  .container {
    overflow: hidden;
    max-height: 140px;

    &.expanded {
      max-height: initial;
    }

    .img {
      width: 100%;
      cursor: zoom-in;

      &.expanded {
        cursor: zoom-out;
      }
    }
  }
</style>

<template>
  <section
    :class="{ expanded }"
    class="container"
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
      :class="{expanded}"
      :src-set="srcset"
      class="img"
    />
  </section>
</template>

<script>
  import ThreadImage from './components/Image';
  import ThreadVideo from './components/Video';

  export default {

    name: 'ThreadMediaContainer',

    components: { ThreadVideo, ThreadImage },

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
        const { local, remote } = src;

        return {
          local: local.thumb,
          remote: remote.thumb,
        };
      },

      fullSrc() {
        const { src } = this.file;
        const { local, remote } = src;

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
