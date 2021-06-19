<template>
  <v-card
    :class="$style.card"
    :loading="imageLoading"
    class="d-flex flex-column align-self-start"
    elevation="2"
  >
    <v-img
      v-if="thread.file"
      :lazy-src="images.thumb"
      :src="images.preview"
      aspect-ratio="1.78"
      class="white--text align-end"
      contain
      gradient="to bottom, rgba(0,0,0,0), rgba(0,0,0,0), rgba(0,0,0,.8)"
      @load="imageLoading = false"
    />
    <v-card-title
      :class="{
        'font-italic': !thread.body.title
      }"
      class="mt-auto"
    >
      <nuxt-link
        :to="{
          name: 'Posts',
          params: thread,
        }"
        v-text="decodeEntities(thread.body.title || 'No title')"
      />
    </v-card-title>

    <v-card-text
      v-if="cardText"
      ref="cardText"
      :class="{
        [$style.cardText]: true,
        [$style.isExpanded]: isExpanded,
        [$style.showExpand]: showExpand,
      }"
      :style="cardTextStyle"
      class="pb-0 mb-2 text-pre-line"
      v-html="cardText"
    />

    <v-divider
      v-if="!showExpand || isExpanded"
    />

    <v-card-actions
      :class="{
        'pt-0': showExpand && !isExpanded,
      }"
    >
      <v-spacer />

      <span class="text--secondary">
        Images: {{ thread.meta.images }} | Replies: {{ thread.meta.replies }}
      </span>

      <v-spacer />

      <v-btn
        v-if="showExpand"
        icon
        @click="isExpanded = !isExpanded"
      >
        <v-icon>{{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
  import {
    AllHtmlEntities as HTMLEntities,
  } from 'html-entities';

  const maxTextHeightPx = 60;

  export default {
    props: {
      thread: {
        type: Object,
        required: true,
      },
    },

    data: () => ({
      showExpand: false,
      isExpanded: false,
      imageLoading: true,
    }),

    computed: {
      cardText() {
        if (!document) {
          return;
        }

        return this.htmlToText(this.thread.body.content);
      },

      images() {
        const { file } = this.thread;

        if (!file) {
          return null;
        }

        return {
          thumb: file.src.remote.thumb,
          preview: file.src.local.thumbHD,
        };
      },

      cardTextStyle() {
        if (!this.isExpanded) {
          return `max-height: ${ maxTextHeightPx }px`;
        } else {
          return 'max-height: 9999px';
        }
      },
    },

    mounted() {
      const $cardText = this.$refs.cardText;

      if (!$cardText) {
        return;
      }

      if ($cardText.offsetHeight < maxTextHeightPx) {
        return;
      }

      this.showExpand = true;
    },

    methods: {
      htmlToText(html) {
        const div = document.createElement('div');
        div.innerHTML = html.replace(/<br>/gi, '\n');

        return div.innerText || div.textContent;
      },

      decodeEntities(text) {
        const htmlEntities = new HTMLEntities();
        return htmlEntities.decode(text);
      },

      log(...args) {
        console.log(...args);
      },
    },
  };
</script>

<style lang="scss" module>
  @import "assets/style/modules/include";

  .card {

    .cardText {
      display: inline-block;
      overflow: hidden;
      transition: max-height 0s ease-in;
      text-overflow: ellipsis;

      &.isExpanded {
        transition: max-height .75s ease-in;
      }

      &.showExpand {
        position: relative;

        &::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 1em;
          content: "";
          transition: background 2s ease-in-out;
          background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, .4));
        }
      }

      &.isExpanded {
        &::after {
          background: transparent;
        }
      }
    }
  }
</style>
