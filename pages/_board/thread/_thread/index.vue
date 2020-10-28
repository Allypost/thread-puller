<template>
  <div>
    <threadpuller-settings />
    <thread-backlinks
      :back-link="{ name: 'Threads', params: { board: boardName }, hash: hash }"
      :external-href="externalHref"
    />

    <h1>Board:</h1>
    <h2>/{{ boardName }}/</h2>
    <h1>Thread:</h1>
    <h2 v-html="title" />

    <posts-container />
  </div>
</template>

<script>
  import {
    AllHtmlEntities as HTMLEntities,
  } from 'html-entities';
  import striptags from 'striptags';
  import {
    mapGetters,
  } from 'vuex';
  import PepeSadImage from '../../../../assets/images/pepe-sad.png';
  import ThreadBacklinks from '../../../../components/ThreadBacklinks';
  import PostsContainer from '../../../../components/posts/Container';
  import ThreadpullerSettings from '../../../../components/settings/Container.vue';

  function getThread(store, threadId) {
    return store.getters[ 'threads/getOne' ](threadId);
  }

  async function fetchThread(store, { isServer, boardName, threadId, cached = false }) {
    const threads = getThread(store, boardName, threadId);

    if (threads && cached) {
      return threads;
    }

    await store.dispatch('threads/fetchOne', { isServer, boardName, threadId });

    return getThread(store, threadId);
  }

  async function threadExists(store, { isServer, boardName, threadId, cached = true }) {
    const thread = await fetchThread(store, { isServer, boardName, threadId, cached });

    return Boolean(thread);
  }

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Posts',

    components: { PostsContainer, ThreadBacklinks, ThreadpullerSettings },

    async validate({ params, store }) {
      const { board: boardName, thread: threadId } = params;
      const isServer = process.server;

      return await threadExists(store, { boardName, threadId, isServer });
    },

    async fetch({ store, params }) {
      const { board: boardName, thread: threadId } = params;
      const isServer = process.server;

      await fetchThread(store, { boardName, threadId, isServer });

      await store.dispatch('posts/fetch', { isServer, boardName, threadId });
    },

    computed: {
      boardName() {
        //noinspection JSUnresolvedVariable
        const { params } = this.$route;
        const { board } = params;

        return board;
      },

      threadId() {
        //noinspection JSUnresolvedVariable
        const { params } = this.$route;
        const { thread } = params;

        return thread;
      },

      title() {
        const { body } = this.originalPost;
        const { title, content } = body;

        return this.decodeEntities(title || content || '<i>No Title</i>', { maxLength: 150, keepTags: '<br><i>' });
      },

      escapedTitle() {
        const htmlEntities = new HTMLEntities();
        const title = this.decodeEntities(this.title, { maxLength: 80, keepTags: '' });

        return htmlEntities.decode(title);
      },

      externalHref() {
        return `https://boards.4chan.org/${ this.boardName }/thread/${ this.threadId }`;
      },

      originalPost() {
        const [ originalPost ] = this.posts;

        return originalPost;
      },

      hash() {
        return (
          Object
            .entries(this.hashData)
            .reduce(
              (acc, [ k, v ]) =>
                `${ acc }${ encodeURIComponent(k) }=${ encodeURIComponent(v) }&`,
              '#',
            )
            .slice(0, -1)
        );
      },

      hashData() {
        return {
          'scroll-to': this.threadId,
        };
      },

      ...mapGetters({
        posts: 'posts/get',
      }),
    },

    methods: {
      decodeEntities(rawText, { maxLength = 150, keepTags = '<br>', br2nl = false }) {
        const normalizedText = rawText.replace(/<br>\s*(<br>)+/gi, '<br>');
        const parsedText = br2nl ? normalizedText.replace(/<br>/gi, '\n') : normalizedText;
        const strippedText = striptags(parsedText, keepTags);

        if (strippedText.length <= maxLength) {
          return strippedText;
        }

        const trimmedText = strippedText.substr(0, maxLength + 1);
        const lastSpace = Math.min(Math.max(0, trimmedText.lastIndexOf(' ')) || maxLength, maxLength);

        return `${ trimmedText.substr(0, lastSpace) }…`;
      },
    },

    head() {
      const { body: originalPostBody, file: originalPostFile } = this.originalPost;
      const title = `/${ this.boardName }/ - ${ this.escapedTitle }`;

      const description = this
        .decodeEntities(originalPostBody.content || originalPostBody.title, { maxLength: 200, br2nl: true })
        .replace(/\n/gi, '\\n');

      const meta = [
        e('og:title', title),
        e('og:description', description),
        e('description', description),
      ];

      if (originalPostFile) {
        meta.push(e('og:image', originalPostFile.src.remote.thumb));
      } else {
        meta.push(e('og:image', PepeSadImage));
      }

      return {
        title,
        meta,
      };
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../../../assets/style/modules/include";

  %text-shadow {
    text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
  }

  $header-font-size: 3em;

  h1, h2 {
    @extend %text-shadow;
    @include no-select();
  }

  h1 {
    font-size: $header-font-size;
    margin: .67em 0;
    margin-bottom: 0;
    text-align: center;

    > a {
      text-shadow: none;
    }
  }

  h2 {
    font-size: #{$header-font-size * .8};
    margin-top: 0;
    color: $text-color;
  }
</style>
