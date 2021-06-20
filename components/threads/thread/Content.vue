<template>
  <section
    :class="{ extended }"
    :data-no-description="!hasDescription"
    :data-no-file="!hasFile"
    class="content"
  >
    <thread-media-container
      v-if="hasFile"
      :file="thread.file"
      style="grid-area: media;"
      @click.native="extended = !extended"
    />

    <thread-description
      v-if="hasDescription"
      :description="description"
      style="grid-area: description;"
    />
  </section>
</template>

<script>
  import ThreadDescription from './Description';
  import ThreadMediaContainer from './media/Container';

  export default {
    name: 'ThreadContent',

    components: { ThreadDescription, ThreadMediaContainer },

    props: {
      thread: {
        type: Object,
        required: true,
      },
    },

    data() {
      return {
        extended: false,
      };
    },

    computed: {
      description() {
        const { body } = this.thread;
        const { content } = body;

        return content;
      },

      hasFile() {
        return Boolean(this.thread.file);
      },

      hasDescription() {
        return Boolean(this.description);
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../../assets/style/modules/include";

  $content-height: 140px;

  .content {
    display: grid;
    overflow: hidden;
    min-height: $content-height;
    color: $text-color;
    border-radius: 6px 6px 0 0;
    background-color: $board-content-background-color;
    grid-template-columns: [media] minmax(0, 1fr) [description] minmax(0, 2fr);
    grid-template-areas: "media description";

    &[data-no-description] {
      align-items: center;
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) minmax(0, 2fr);
      grid-template-areas: "_ media __";
    }

    &[data-no-file] {
      align-items: center;
      grid-template-columns: minmax(0, 1fr) minmax(0, 4fr) minmax(0, 1fr);
      grid-template-areas: "_ description __";
    }

    &.extended {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "media" "description";
    }
  }
</style>
