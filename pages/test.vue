<template>
  <div>hello</div>
</template>

<script>
  export default {
    methods: {
      parseContent(board, content) {
        if (!content) {
          return '';
        }

        return (
          content
            .replace(/[^>]>>>\/([^/]+)\//gi, '<a class="boardlink" href="/$1/">&gt;&gt;&gt;$1</a>')
            .replace(/[^>]>>(\d+)/gi, `<a class="quotelink" href="/${ board }/res/$1#p$1">&gt;&gt;$1</a>`)
        );
      },
    },
  };
</script>
