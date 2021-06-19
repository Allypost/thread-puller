<template>
  <div :class="$style.pageContainer">
    <v-row>
      <v-col
        cols="12"
        :class="$style.contentContainer"
      >
        <slot v-bind="$attrs" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
  export default {
    name: 'AppMaxWidthContainer',

    inheritAttrs: false,
  };
</script>

<style lang="scss" module>
  @import "../assets/style/modules/include";

  .pageContainer {

    .contentContainer {
      max-width: $content-max-width;
      margin: 0 auto 2em;
      padding: 0 2em;

      @include media(sm) {
        max-width: $content-max-width-mobile;
      }
    }
  }
</style>
