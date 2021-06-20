<template>
  <section
    v-linkified
    :class="{isLong, expanded}"
    class="description"
    @click="expanded = !expanded"
    v-html="description"
  />
</template>

<script>
  export default {
    name: 'ThreadDescription',

    props: {
      description: {
        type: String,
        required: true,
      },
    },

    data() {
      return {
        isLong: false,
        expanded: false,
      };
    },

    computed: {

      hasDescription() {
        return Boolean(this.description);
      },

    },

    mounted() {
      this.isLong = 164 < this.$el.scrollHeight;
    },
  };
</script>

<style lang="scss" scoped>
  $content-height: 140px;

  .description {
    position: relative;
    min-height: 85px;
    max-height: $content-height;
    padding: .35em .5em;
    text-align: left;

    &.isLong {
      cursor: zoom-in;

      &:not(.expanded)::after {
        position: absolute;
        top: calc(140px - 1em);
        left: 0;
        width: 100%;
        height: 2em;
        content: "";
        background-image: linear-gradient(180deg, transparent, #000000 85%);
      }

      &.expanded {
        max-height: none;
        cursor: zoom-out;
      }
    }
  }
</style>

<style lang="scss">
  @import "../../../assets/style/modules/include";

  .quote {
    color: $quote-color;
  }

  .prettyprint {
    white-space: pre-wrap;
  }
</style>
