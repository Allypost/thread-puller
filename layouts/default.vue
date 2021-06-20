<style lang="scss" src="../assets/style/global.scss"></style>
<style lang="scss" scoped>
  @import "../assets/style/modules/include";

  #wrap {
    $footer-height: 2em;

    position: relative;
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    min-height: 100vh;
    margin: 0;
    text-align: center;

    .page-container {
      min-height: 100%;
      padding-bottom: $footer-height;
    }

    > footer {
      position: absolute;
      bottom: 0;
      align-self: center;
      flex-shrink: 0;
      max-width: 700px;
      height: $footer-height;
      margin: 0 auto;
      padding: 10px 18px;
      text-align: center;
      border-radius: 6px 6px 0 0;
      background: darken($background-color, 5%);

      @include no-select();
    }
  }
</style>

<template>
  <div id="wrap">
    <nuxt class="page-container" />
    <footer>
      Copyright &copy; {{ new Date().getFullYear() }}
      <a
        v-if="hasRepositoryUrl"
        :href="repositoryUrl"
        rel="noopener noreferrer"
        target="_blank"
      >
        Allypost
      </a>
      <span
        v-else
      >
        Allypost
      </span>
      | All content is courtesy of
      <a
        href="https://www.4chan.org"
        rel="noopener noreferrer"
        target="_blank"
      >
        4chan
      </a>
      <span v-if="hasDonateLink">
        |
        <a
          :href="donateLink"
          rel="noopener noreferrer"
          target="_blank"
        >
          Buy me a coffee
        </a>
      </span>
    </footer>
  </div>
</template>

<script>
  export default {
    data: () => (
      {
        donateLink: '',
        repositoryUrl: process.env.THREADPULLER_REPOSITORY_URL,
      }
    ),

    head() {
      return {
        titleTemplate(titleChunk) {
          if (titleChunk) {
            return `${ titleChunk } | ThreadPuller`;
          }

          return 'ThreadPuller - Pull 4Chan media';
        },
      };
    },

    computed: {
      hasDonateLink() {
        return Boolean(this.donateLink);
      },

      hasRepositoryUrl() {
        return Boolean(this.repositoryUrl);
      },
    },
  };
</script>

