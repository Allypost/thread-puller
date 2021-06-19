<template>
  <app-max-width-container style="margin-top: 1em;">
    <v-row>
      <v-col cols="12">
        <nuxt-link
          :to="{ name: 'Threads', params: { board: boardName } }"
          v-text="'Back'"
        />
        |
        <a
          :href="externalHref"
          rel="noopener noreferrer"
          target="_blank"
          v-text="'Go to thread'"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h1>
          Board: <span v-text="boardName" />
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h1>
          Thread: <span v-text="title" />
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="post in posts"
        :key="post.id"
        cols="12"
        lg="3"
        md="4"
        sm="6"
      >
        <v-card
          :id="`p${post.id}`"
          :loading="post.loading"
        >
          <v-img
            :aspect-ratio="post.file.dimensions.main.width / post.file.dimensions.main.height"
            :class="$style.image"
            :lazy-src="post.file.src.remote.thumb"
            :src="post.file.src.remote.full"
            :title="post.file.name"
            contain
            @click="openImage = post"
            @load="post.loading = false"
          />

          <v-card-actions
            :class="$style.actions"
          >
            <v-btn
              :class="$style.goToPost"
              :href="externalHrefFor(post)"
              color="secondary"
              target="_blank"
            >
              Go to post
            </v-btn>

            <v-btn
              :class="$style.link"
              :href="`#p${post.id}`"
              icon
              title="Link to this post"
            >
              <v-icon>mdi-link-variant</v-icon>
            </v-btn>

            <v-btn
              v-if="post.meta.hasReplies"
              :class="$style.replies"
              plain
            >
              Replies: {{ post.meta.replies.length }}
            </v-btn>

            <v-btn
              v-if="post.meta.hasMentions"
              :class="$style.mentions"
              plain
            >
              Mentions: {{ post.meta.mentions.length }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog
      :value="openImage"
      @input="openImage = $event ? openImage : null"
    >
      <v-card
        v-if="openImage"
        :class="$style.dialog"
      >
        <v-img
          :aspect-ratio="openImage.file.dimensions.main.width / openImage.file.dimensions.main.height"
          :lazy-src="openImage.file.src.remote.thumb"
          :src="openImage.file.src.remote.full"
          :title="openImage.file.name"
          contain
        />
      </v-card>
    </v-dialog>
  </app-max-width-container>
</template>

<router>
name: Posts
</router>

<script>
  import {
    AllHtmlEntities as HTMLEntities,
  } from 'html-entities';
  import striptags from 'striptags';
  import PepeSadImage from '@/assets/images/pepe-sad.png';
  import AppMaxWidthContainer from '@/components/AppMaxWidthContainer';

  function e(name, content) {
    return { hid: name, name, content };
  }

  export default {
    name: 'Posts',

    components: {
      AppMaxWidthContainer,
    },

    async validate({ params, store }) {
      const { board: boardName, thread: threadId } = params;

      return await store.dispatch('posts/fetch', { boardName, threadId });
    },

    async asyncData({ store }) {
      const postList =
        store
          .getters[ 'posts/POSTS' ]
          .filter(({ file }) => file)
          .map((post) => ({
            ...post,
            loading: true,
            meta: {
              ...post.meta,
              hasMentions: 0 < post.meta.mentions.length,
              hasReplies: 0 < post.meta.replies.length,
            },
          }))
      ;
      const posts = postList.reduce((acc, post) => ({ ...acc, [ post.id ]: post }), {});

      return {
        postList,
        posts,
        openImage: null,
      };
    },

    computed: {
      boardName() {
        //noinspection JSUnresolvedVariable
        const { params } = this.$route;
        const { board } = params;

        return board;
      },

      threadId() {
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
        return this.externalHrefFor({ id: this.threadId });
      },

      originalPost() {
        const [ originalPost ] = this.postList;

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

      externalHrefFor({ id }) {
        return `https://boards.4chan.org/${ this.boardName }/thread/${ this.threadId }#p${ id }`;
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

<style lang="scss" module>
  @import "assets/style/modules/include";

  .image {
    cursor: zoom-in;
  }

  .dialog {
    min-width: 90vw;
    max-width: 98vw;
  }

  .actions {
    display: grid;
    align-items: center;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 36px;
    grid-template-areas: "replies go-to-post mentions link";
    grid-column-gap: .5em;

    > * + * {
      margin-left: 0 !important;
    }

    .replies {
      grid-area: replies;
    }

    .goToPost {
      grid-area: go-to-post;
    }

    .mentions {
      grid-area: mentions;
    }

    .link {
      grid-area: link;
    }
  }
</style>
