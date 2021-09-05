<template>
  <span :class="$style.container">
    <img
      :alt="alt"
      :class="{
        [$style.loading]: isLoading
      }"
      :src="src"
      draggable="false"
      @error="handleError"
      @load="isLoading = false"
    >
    <LoaderSpinner
      v-if="isLoading"
      :class="$style.spinner"
    />
  </span>
</template>

<script>
  import FileDeletedImage from '../../../../../assets/images/deleted.gif';
  import LoaderSpinner from '../LoaderSpinner';

  export default {
    name: 'ThreadImage',

    components: { LoaderSpinner },

    props: {
      srcSet: {
        type: Object,
        required: true,
      },
      alt: {
        type: String,
        required: true,
      },
    },

    data() {
      return {
        errors: {},
        isLoading: false,
      };
    },

    computed: {
      src() {
        const {
          local,
          remote,
        } = this.srcSet;

        const src = [ remote, local, FileDeletedImage ];

        return src.find((src) => !this.srcHadError(src));
      },
    },

    watch: {
      src() {
        this.isLoading = true;
      },
    },

    methods: {
      handleError() {
        this.$set(this.errors, this.src, true);
      },

      srcHadError(src) {
        const { errors } = this;

        return Boolean(errors[ src ]);
      },
    },
  };
</script>

<style lang="scss" module>
  @import "../../../../../assets/style/modules/include";

  .container {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .spinner {
    position: absolute;
    top: .5em;
    right: .5em;
  }

  img {
    width: 100%;
    transition: .25s filter ease-out;
    filter: none;

    &.loading {
      filter: progid:dximagetransform.microsoft.blur(pixelradius="2");
      filter: blur(2px);
    }
  }

</style>
