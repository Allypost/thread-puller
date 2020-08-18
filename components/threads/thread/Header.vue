<style lang="scss" scoped>
  @import "../../../assets/style/modules/include";

  header {
    margin-bottom: .3em;
  }

  .title {
    font-size: 1.3em;
    font-weight: 700;
    margin: 0;
    text-align: center;
    word-break: break-word;
    color: invert($text-color);
  }

  .no-title {
    font-weight: normal;
  }
</style>

<template>
  <header>
    <n-link
      :to="{ name: 'Posts', params: { board: thread.board, thread: thread.id } }"
      class="title"
    >
      <span
        v-if="hasTitle"
        v-html="title"
      />
      <i
        v-else
        class="no-title"
      >No title</i>
    </n-link>
  </header>
</template>

<script>
  export default {
    name: 'ThreadHeader',

    props: {
      thread: {
        type: Object,
        required: true,
      },
    },

    computed: {
      hasTitle() {
        return Boolean(this.title);
      },

      title() {
        const { body } = this.thread;
        const { title } = body;

        return title;
      },
    },

  };
</script>
