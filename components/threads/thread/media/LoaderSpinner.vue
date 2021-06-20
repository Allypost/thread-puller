<template>
  <div
    :style="style"
    class="spinner"
  />
</template>

<script>
  export default {
    name: 'LoaderSpinner',

    props: {
      size: {
        type: String,
        default: '50px',
      },
    },

    computed: {
      style() {
        const { size } = this;
        return `width: ${ size }; height: ${ size }`;
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../../../assets/style/modules/include";

  .spinner {
    @keyframes spin {

      to {
        -webkit-transform: rotate(360deg);
      }

    }

    display: inline-block;
    width: 50px;
    height: 50px;
    animation: spin 1s cubic-bezier(.65, .05, .3, .8) infinite;
    border: 3px solid rgba(255, 255, 255, .3);
    border-top-color: #ffffff;
    border-radius: 50%;
    background: #455a64;
  }
</style>
