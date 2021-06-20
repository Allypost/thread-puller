<template>
  <article
    :id="`p${ post.id }`"
    class="resource"
  >
    <section>
      <post-video
        v-if="isVideo"
        :file="file"
      />
      <post-image
        v-else
        :file="file"
      />
    </section>

    <footer>
      <span
        v-if="Boolean(post.meta.replies.length)"
        :data-replies="post.meta.replies.join(',')"
        class="footer-button replies"
      >
        Replies: {{ post.meta.replies.length }}
      </span>
      <a
        :href="postBacklink"
        class="footer-button post-btn"
        rel="noopener noreferrer"
        target="_blank"
      >
        Go to post
      </a>
      <span
        v-if="Boolean(post.meta.mentions.length)"
        :data-mentions="post.meta.mentions.join(',')"
        class="footer-button mentions"
      >
        Mentions: {{ post.meta.mentions.length }}
      </span>
      <n-link
        :to="`#p${ post.id }`"
        class="footer-button link"
        title="Link to this post"
      >
        <LinkImage />
      </n-link>
    </footer>
  </article>
</template>

<script>
  import LinkImage from '../../assets/images/link.svg';
  import PostImage from './components/media/Image.vue';
  import PostVideo from './components/media/Video.vue';

  export default {
    name: 'ThreadPost',

    components: { PostImage, PostVideo, LinkImage },

    props: {
      post: {
        type: Object,
        required: true,
      },
    },

    computed: {
      file() {
        const { file } = this.post;
        return file;
      },

      isVideo() {
        return this.file.meta.isVideo;
      },

      postBacklink() {
        return `https://boards.4chan.org/${ this.post.board }/thread/${ this.post.thread }#p${ this.post.id }`;
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  .resource {
    @extend %card-shadow;

    display: grid;
    overflow: hidden;
    transform: translateZ(0);
    border-radius: 8px;
    background: #37474f;
    grid-template-rows: 1fr 3em;

    footer {
      display: grid;
      align-items: center;
      padding: 0 .69em;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 1.8em;
      grid-template-areas: "replies post-btn mentions link";
      grid-column-gap: .5em;

      .footer-button {
        padding: .5em 1em;
        transition-timing-function: $transition-smooth;
        transition-duration: .25s;
        transition-property: box-shadow, color;
        text-decoration: none;
        border: 1px solid #263238;
        border-radius: 6px;
      }

      .replies {
        grid-area: replies;
      }

      .mentions {
        grid-area: mentions;
      }

      .post-btn {
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
    }
  }
</style>
