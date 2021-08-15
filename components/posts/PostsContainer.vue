<template>
  <div
    :class="{ hasImageFocused: Boolean(focusedImage) }"
    class="top-container"
  >
    <div class="container">
      <thread-post
        v-for="post in mediaPosts"
        :key="post.id"
        :post="post"
      />
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
          :src-set="focusedImageSrcset"
          class="thread-image"
        />
      </sweet-modal>
    </client-only>
  </div>
</template>

<script>
  import {
    SweetModal,
  } from 'sweet-modal-vue';
  import {
    mapGetters,
    mapMutations,
  } from 'vuex';
  import ThreadImage from '../threads/thread/media/components/ThreadMediaThumb';
  import ThreadPost from './ThreadPost';

  export default {
    name: 'PostsContainer',

    components: { ThreadPost, ThreadImage, SweetModal },

    computed: {
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

        const { local, remote } = focused.src;

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
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  .container {
    @extend %container-base;

    align-items: end;
  }

  #focused-post-modal {
    cursor: zoom-out;
    background-color: rgba(0, 0, 0, .5);

    .thread-image {
      @include no-select();

      display: grid;
      align-items: center;
      height: calc(98vh - 130px);
      margin: 0 auto;
      text-align: center;
    }
  }
</style>
<style lang="scss">
  @import "../../assets/style/modules/include";

  #focused-post-modal {

    .sweet-modal {
      min-width: 90vw;
      max-width: 98vw;
      max-height: 98vh;
      padding: .5em;
      background: $background-color;

      .sweet-content {
        padding: 64px 0 0 0;
      }

      .thread-image {

        > img {
          @extend %card-shadow;

          width: auto;
          min-width: 50%;
          max-width: 100%;
          // min-height: 100%;
          margin: 0 auto;
        }
      }
    }
  }
</style>
