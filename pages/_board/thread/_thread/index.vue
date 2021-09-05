<template>
  <div :class="$style.container">
    <threadpuller-settings />
    <thread-backlinks
      :back-link="{ name: 'Threads', params: { board: boardName }, hash: hash }"
      :external-href="externalHref"
    />

    <h1>Board:</h1>
    <h2>/{{ boardName }}/</h2>
    <h1>Thread:</h1>
    <h2 v-html="title" />

    <div>
      <div :class="$style.postsContainer">
        <article
          v-for="post in mediaPosts"
          :id="`p${ post.id }`"
          :key="post.id"
          :class="$style.resource"
        >
          <section>
            <post-video
              v-if="post.file.meta.isVideo"
              :file="post.file"
            />
            <post-image
              v-else
              :file="post.file"
            />
          </section>

          <footer>
            <span
              v-if="post.meta.replies.length"
              :class="[
                $style.footerButton,
                $style.replies,
              ]"
              :data-replies="post.meta.replies.join(',')"
            >
              <span
                :class="$style.onLarge"
                title="# of replies to this post"
              >
                Replies:
              </span>
              <corner-down-right-icon
                :class="$style.onSmall"
                size="1x"
                title="# of replies to this post"
              />
              <span v-text="post.meta.replies.length" />
            </span>

            <a
              :class="[
                $style.footerButton,
                $style.postBtn,
              ]"
              :href="`https://boards.4chan.org/${ post.board }/thread/${ post.thread }#p${ post.id }`"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span
                :class="$style.onLarge"
              >
                Go to post
              </span>
              <span
                :class="$style.onSmall"
              >
                <external-link-icon size="1x" />
              </span>
            </a>

            <span
              v-if="post.meta.mentions.length"
              :class="[
                $style.footerButton,
                $style.mentions,
              ]"
              :data-mentions="post.meta.mentions.join(',')"
            >
              <span
                :class="$style.onLarge"
                title="# of other posts mentioned"
              >
                Mentions:
              </span>
              <span v-text="post.meta.mentions.length" />
              <corner-right-up-icon
                :class="$style.onSmall"
                size="1x"
                title="# of other posts mentioned"
              />
            </span>

            <nuxt-link
              :class="[
                $style.footerButton,
                $style.link,
              ]"
              :to="`#p${ post.id }`"
              title="Link to this post"
            >
              <link-icon />
            </nuxt-link>
          </footer>
        </article>
      </div>

      <client-only>
        <sweet-modal
          id="focused-post-modal"
          ref="modal"
          modal-theme="dark"
          overlay-theme="dark"
          @close="unfocusImage"
        >
          <thread-image
            v-if="focusedImage"
            :alt="focusedImage.name"
            :class="$style.threadImage"
            :src-set="focusedImageSrcset"
          />
        </sweet-modal>
      </client-only>
    </div>
  </div>
</template>

<router>
name: Posts
</router>

<script>
  import {
    decode as decodeHtmlEntities,
  } from 'html-entities';
  import striptags from 'striptags';
  import {
    SweetModal,
  } from 'sweet-modal-vue';
  import {
    LinkIcon,
    CornerDownRightIcon,
    CornerRightUpIcon,
    ExternalLinkIcon,
  } from 'vue-feather-icons';
  import {
    mapGetters,
    mapMutations,
  } from 'vuex';
  import PepeSadImage from '../../../../assets/images/pepe-sad.png';
  import ThreadBacklinks from '../../../../components/ThreadBacklinks';
  import PostImage from '../../../../components/posts/components/media/PostImage';
  import PostVideo from '../../../../components/posts/components/media/PostVideo';
  import ThreadpullerSettings from '../../../../components/settings/ThreadpullerSettings';
  import ThreadImage from '../../../../components/threads/thread/media/components/ThreadImage';

  import {
    generateMetadata,
  } from '../../../../lib/Helpers/Head/metadata';

  export default {
    name: 'Posts',

    components: {
      LinkIcon,
      CornerDownRightIcon,
      CornerRightUpIcon,
      ExternalLinkIcon,
      PostImage,
      PostVideo,
      ThreadImage,
      SweetModal,
      ThreadBacklinks,
      ThreadpullerSettings,
    },

    async fetch({
      params,
      store,
      error,
    }) {
      const {
        board: boardName,
        thread: threadId,
      } = params;

      const [ firstPost ] = await store.dispatch(
        'posts/fetch',
        {
          boardName,
          threadId,
        },
      );

      if (!firstPost) {
        error({
          statusCode: 404,
          message: 'Thread does not exist',
        });
      }
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
        const {
          title,
          content,
        } = body;

        return this.decodeEntities(
          title || content || '<i>No Title</i>',
          {
            maxLength: 150,
            keepTags: '<br><i>',
          },
        );
      },

      escapedTitle() {
        const title = this.decodeEntities(
          this.title,
          {
            maxLength: 80,
            keepTags: '',
          },
        );

        return decodeHtmlEntities(title);
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

      mediaPosts() {
        return this.posts.filter(({ file }) => Boolean(file));
      },

      focusedImage() {
        const focused = this.focusedPost;

        if (!focused) {
          return null;
        }

        return focused.file;
      },

      focusedImageSrcset() {
        const focused = this.focusedImage;

        if (!focused) {
          return {};
        }

        const {
          local,
          remote,
        } = focused.src;

        return {
          local: local.full,
          remote: remote.full,
        };
      },

      ...mapGetters('posts', {
        posts: 'posts',
        focusedPost: 'focused',
      }),
    },

    watch: {
      focusedPost(changed) {
        if (null !== changed) {
          this.$refs.modal.open();
        }
      },
    },

    methods: {
      ...mapMutations({
        unfocusImage: 'posts/SET_UNFOCUSED',
      }),

      decodeEntities(
        rawText,
        {
          maxLength = 150,
          keepTags = '<br>',
          br2nl = false,
        },
      ) {
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
      const {
        body: originalPostBody,
        file: originalPostFile,
      } = this.originalPost;
      const title = `/${ this.boardName }/ - ${ this.escapedTitle }`;

      const description = this
        .decodeEntities(
          originalPostBody.content || originalPostBody.title,
          {
            maxLength: 200,
            br2nl: true,
          },
        )
        .replace(/\n/gi, '\\n');

      const meta = {
        title,
        description,
        image: originalPostFile?.src.remote.thumb || PepeSadImage,
      };

      return {
        title,
        meta: generateMetadata(meta),
      };
    },
  };
</script>

<style lang="scss" module>
  @import "../../../../assets/style/modules/include";

  .container {
    %text-shadow {
      text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
    }

    $header-font-size: 3em;

    h1,
    h2 {
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
  }

  .onLarge {
    @media #{$small-and-down} {
      display: none;
    }
  }

  .onSmall {
    @media #{$small-and-up} {
      display: none;
    }
  }

  .postsContainer {
    @extend %container-base;

    align-items: end;
  }

  .threadImage {
    @include no-select();

    display: grid;
    align-items: center;
    height: calc(98vh - 130px);
    margin: 0 auto;
    text-align: center;

    & > img {
      @extend %card-shadow;

      width: auto;
      min-width: 50%;
      max-width: 100%;
      // min-height: 100%;
      margin: 0 auto;
    }
  }

  :global(#focused-post-modal) {
    cursor: zoom-out;
    background-color: rgba(0, 0, 0, .5);

    :global(.sweet-modal) {
      min-width: 90vw;
      max-width: 98vw;
      max-height: 98vh;
      padding: .5em;
      background: $background-color;

      :global(.sweet-content) {
        padding: 64px 0 0 0;
      }
    }
  }

  .resource {
    @extend %card-shadow;

    display: grid;
    overflow: hidden;
    transform: translateZ(0);
    border-radius: 8px;
    background: $post-background-color;
    grid-template-rows: 1fr 3em;

    footer {
      display: grid;
      align-items: center;
      padding: 0 .69em;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 1.8em;
      grid-template-areas: "replies post-btn mentions link";
      grid-column-gap: .5em;
    }
  }

  .footerButton {
    @extend %link;

    padding: .5em 1em;
    transition-timing-function: $transition-smooth;
    transition-duration: .25s;
    transition-property: box-shadow, color;
    text-decoration: none;
    border: 1px solid #{darken($post-background-color, 10%)};
    border-radius: 6px;
  }

  .replies {
    grid-area: replies;
  }

  .mentions {
    grid-area: mentions;
  }

  .postBtn {
    background-color: $background-color;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .12), 0 1px 5px 0 rgba(0, 0, 0, .2);
    grid-area: post-btn;
  }

  .link {
    display: block;
    padding: 0;
    border: none;
    grid-area: link;
  }
</style>
