<template>
  <h1 :class="$style.container">
    <nuxt-link
      :class="$style.link"
      :to="backLink"
    >
      Back
    </nuxt-link>
    <span class="separator">|</span>
    <a
      :class="$style.link"
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

<style lang="scss" module>
  @import "../assets/style/modules/include";

  .container {
    font-size: 3em;
    margin: .67em 0;
    margin-bottom: 0;
    text-align: center;
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;

    @include no-select();
  }

  .link {
    @extend %link;

    text-shadow: none;
  }
</style>
