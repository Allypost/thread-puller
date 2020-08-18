<style lang="scss" scoped>
  @import "../assets/style/modules/include";

  h1 {
    font-size: 3em;
    margin: .67em 0;
    margin-bottom: 0;
    text-align: center;
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
    @include no-select();

    > a {
      text-shadow: none;
    }
  }
</style>

<template>
  <h1>
    <n-link :to="backLink">
      Back
    </n-link>
    <span class="separator">|</span>
    <a
      :href="externalHref"
      rel="noopener noreferrer"
      target="_blank"
    >
      Go to board
    </a>
  </h1>
</template>

<script>
  export default {
    name: 'ThreadBacklinks',

    props: {
      backLink: {
        type: [ String, Object ],
        required: true,
      },
      externalHref: {
        type: String,
        required: true,
      },
    },
  };
</script>
