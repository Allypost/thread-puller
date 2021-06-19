<template>
  <v-app>
    <v-main
      :class="$vuetify.theme.dark ? 'darken-4' : 'lighten-4'"
      class="blue-grey"
    >
      <v-container>
        <v-toolbar
          flat
          height="72"
        >
          <v-switch
            v-model="$vuetify.theme.dark"
            hint="This toggles the global state of the Vuetify theme"
            inset
            label="Vuetify Theme Dark"
            persistent-hint
          />
        </v-toolbar>

        <nuxt />
      </v-container>
    </v-main>

    <peer-count :socket="socket" />

    <v-footer
      :class="$vuetify.theme.dark ? 'darken-3' : 'lighten-3'"
      absolute
      app
      class="blue-grey mx-auto"
      max-width="700px"
    >
      <v-row dense>
        <v-col
          class="text-center"
          cols="12"
        >
          Copyright &copy; {{ new Date().getFullYear() }}
          <a
            :is="hasRepositoryUrl ? 'a' : 'span'"
            :href="repositoryUrl"
            rel="noopener noreferrer"
            target="_blank"
          >
            Allypost
          </a>
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
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
  import PeerCount from '../components/PeerCount';

  export default {
    components: {
      PeerCount,
    },

    data: () => (
      {
        donateLink: '',
        repositoryUrl: process.env.THREADPULLER_REPOSITORY_URL,
      }
    ),

    computed: {
      hasDonateLink() {
        return Boolean(this.donateLink);
      },

      hasRepositoryUrl() {
        return Boolean(this.repositoryUrl);
      },
    },

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
  };
</script>

