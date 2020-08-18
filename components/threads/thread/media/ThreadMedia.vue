<template>
  <thread-video
    v-if="isVideo"
    :file="file"
  />

  <thread-image
    v-else
    :alt="alt"
    :src-set="srcset"
  />
</template>

<script>
  import ThreadImage from './components/Image';
  import ThreadVideo from './components/Video';

  export default {
    name: 'ThreadMedia',

    components: { ThreadImage, ThreadVideo },

    props: {
      file: {
        type: Object,
        required: true,
      },
    },

    computed: {
      isVideo() {
        return this.file.meta.isVideo;
      },

      alt() {
        const { name } = this.file;

        return name;
      },

      srcset() {
        const { src } = this.file;
        const { local, remote } = src;

        return {
          local: local.full,
          remote: remote.full,
        };
      },
    },
  };
</script>
