<template>
  <article
    :id="id"
    :class="$style.board"
  >
    <header :class="$style.threadHeader">
      <nuxt-link
        :class="$style.title"
        :to="{ name: 'Posts', params: { board: thread.board, thread: thread.id } }"
      >
        <span
          v-if="hasTitle"
          v-html="title"
        />
        <i
          v-else
          :class="$style.noTitle"
        >No title</i>
      </nuxt-link>
    </header>

    <section
      :class="$style.descriptionContainer"
      :data-expanded="descriptionExpanded"
      :data-expanded-text="descriptionTextExpanded"
      :data-no-description="!hasDescription"
      :data-no-file="!hasFile"
    >
      <thread-media-container
        v-if="hasFile"
        :class="{
          [$style.descriptionMedia]: true,
        }"
        :file="file"
        @click.native="descriptionExpanded = !descriptionExpanded"
      />

      <section
        v-if="hasDescription"
        ref="descriptionText"
        v-linkified
        :class="{
          [$style.descriptionText]: true,
          [$style.descriptionTextIsLong]: descriptionTextIsLong,
          [$style.descriptionTextExpanded]: descriptionTextExpanded,
        }"
        :data-expanded="descriptionTextExpanded"
        :data-long="descriptionTextIsLong"
        @click="descriptionTextExpanded = !descriptionTextExpanded"
        v-html="description"
      />
    </section>

    <footer
      :class="$style.footer"
    >
      <span>
        {{ thread.meta.images }} images | {{ thread.meta.replies }} replies <span v-if="showBoardName">| /{{ thread.board }}/</span>
      </span>
    </footer>
  </article>
</template>

<script>
  import constant from 'lodash/fp/constant';
  import ThreadMediaContainer from './thread/media/ThreadMediaContainer';

  export default {
    name: 'BoardThread',

    components: {
      ThreadMediaContainer,
    },

    props: {
      thread: {
        type: Object,
        required: true,
      },
      showBoardName: {
        type: Boolean,
        required: false,
        default: constant(false),
      },
    },

    data: () => ({
      descriptionTextIsLong: false,
      descriptionExpanded: false,
      descriptionTextExpanded: false,
    }),

    computed: {
      id() {
        const { id } = this.thread;

        return `post-${ id }`;
      },

      title() {
        const { body } = this.thread;
        const { title } = body;

        return title;
      },

      hasTitle() {
        return Boolean(this.title);
      },

      description() {
        const { body } = this.thread;
        const { content } = body;

        return content;
      },

      hasDescription() {
        return Boolean(this.description);
      },

      file() {
        if (1 <= this.thread.files?.length) {
          return this.thread.files[ 0 ];
        }

        return this.thread.file;
      },

      hasFile() {
        return Boolean(this.file);
      },
    },

    mounted() {
      if (this.hasDescription) {
        this.descriptionTextIsLong = 164 < this.$refs.descriptionText.scrollHeight;
      }

      const { hash = '' } = this.$route;

      if (hash.trim().length) {
        const
          values =
            hash
              .trim()
              .substring(1)
              .split('&')
              .map((el) => el.split('='))
              .reduce(
                (acc, [ k, v ]) => ({
                  ...acc,
                  [ decodeURIComponent(k) ]: decodeURIComponent(v),
                }),
                {},
              );

        const { 'scroll-to': scrollTo } = values;

        if (scrollTo && Number(scrollTo) === this.thread.id) {
          window.requestIdleCallback(
            () => {
              try {
                const top = this.$el.documentOffsetTop() - (window.innerHeight / 2);
                window.scrollTo(0, top);
                // this.$el.scrollIntoView(false);
                // eslint-disable-next-line no-empty
              } catch {
              }
            },
            {
              timeout: 850,
            },
          );
        }
      }
    },
  };
</script>

<style lang="scss" module>
  @import "../../assets/style/modules/include";

  $content-height: 140px;

  .board {
    font-size: 1.4em;
    display: grid;
    padding: .5em;
    border-radius: 4px;
    background-color: $board-background-color;
    grid-template-rows: auto 1fr 1.5em;
  }

  .threadHeader {
    margin-bottom: .3em;
  }

  .title {
    @extend %link;

    font-size: 1.3em;
    font-weight: 700;
    margin: 0;
    text-align: center;
    word-break: break-word;
    color: invert($text-color);
  }

  .noTitle {
    font-weight: normal;
  }

  %description-expanded {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "media" "description";
  }

  .descriptionContainer {
    display: grid;
    overflow: hidden;
    min-height: $content-height;
    color: $text-color;
    border-radius: 6px 6px 0 0;
    background-color: $board-content-background-color;
    grid-template-columns: [media] minmax(0, 1fr) [description] minmax(0, 2fr);
    grid-template-areas: "media description";

    &:not(&[data-expanded]) {

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
    }

    &[data-expanded] {
      @extend %description-expanded;
    }

    a {
      @extend %link;
    }

    s {
      @extend %spoiler;
    }
  }

  .descriptionMedia {
    grid-area: media;
  }

  .descriptionText {
    position: relative;
    min-height: 85px;
    max-height: $content-height;
    padding: .35em .5em;
    text-align: left;
    grid-area: description;

    &[data-long] {
      cursor: zoom-in;

      &:not(&[data-expanded])::after {
        position: absolute;
        top: calc(140px - 1em);
        left: 0;
        width: 100%;
        height: 2em;
        content: "";
        background-image: linear-gradient(180deg, transparent, #000000 85%);
      }

      &[data-expanded] {
        max-height: none;
        cursor: zoom-out;
      }
    }
  }

  .descriptionContainer[data-no-file][data-expanded-text] {
    @extend %description-expanded;
  }

  .footer {
    font-size: .8em;
    display: grid;
    align-items: center;
    border-radius: 0 0 6px 6px;
    background-color: $board-footer-background-color;
  }
</style>
