function meta(name, content) {
  return { hid: name, name, content };
}

module.exports = {
  mode: 'universal',
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      meta('viewport', 'width=device-width, initial-scale=1'),
      meta('referrer', 'never'),
      meta('theme-color', '#1e1e1e'),
      meta('msapplication-TileColor', '#1e1e1e'),
      meta('application-name', process.env.npm_package_description || ''),
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
    script: [
      { innerHTML: 'window.goatcounter={no_onload: true}', type: 'text/javascript', charset: 'utf-8' },
      { src: '//gc.zgo.at/count.js', 'data-goatcounter': process.env.THREADPULLER_GOATCOUNTER_URL, async: true },
    ],
    __dangerouslyDisableSanitizers: [ 'script' ],
  },

  serverMiddleware: [
    '~/api/v1/4chan',
    '~/api/v1/4chan-images',
    {
      path: '/api/v2',
      handler: '~/api/v2/index',
    },
  ],

  router: {
    middleware: [ 'set-presence-cookie' ],
  },

  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: '#fafafa',
    failedColor: '#e53935',
    height: '8px',
    continuous: true,
  },

  /*
   ** Global CSS
   */
  css: [],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: '~plugins/add-client-polyfill.js', ssr: false },
    '~/plugins/load-settings-from-cookie',
    '~/plugins/add-v-focus-directive',
    '~/plugins/add-linkify-directive',
    { src: '~plugins/share-vuex-settings-mutations.js', ssr: false },
    { src: '~plugins/analytics/goatcounter.js', ssr: false },
  ],

  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxt/typescript-build',
    '@nuxtjs/eslint-module',
    '@aceforth/nuxt-optimized-images',
  ],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
    'nuxt-svg-loader',
    [ 'cookie-universal-nuxt', { parseJSON: false } ],
    '@nuxtjs/router-extras',
    '~/modules/4chan/refresher',
    '~/modules/presence',
  ],

  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {},

  /*
   ** Build configuration
   */
  build: {
    loaders: {
      vue: {
        video: [ 'src', 'poster' ],
        source: 'src',
        img: 'src',
        image: [ 'xlink:href', 'href' ],
        use: [ 'xlink:href', 'href' ],
      },
    },

    postcss: {
      plugins: {
        'postcss-normalize': {},
        'postcss-font-magician': {},
        'pixrem': {},
        'autoprefixer': {},
        'cssnano': { preset: 'default' },
      },
    },

    optimization: {
      concatenateModules: true,
      moduleIds: 'hashed',
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: 50,
        maxInitialRequests: 20,
        name: false,
      },
    },

    splitChunks: {
      layouts: true,
      pages: true,
      commons: true,
    },
  },

  optimizedImages: {
    optimizeImages: true,
  },

  env: {
    THREADPULLER_GOATCOUNTER_URL: process.env.THREADPULLER_GOATCOUNTER_URL,
    THREADPULLER_REPOSITORY_URL: process.env.THREADPULLER_REPOSITORY_URL,
  },
};
