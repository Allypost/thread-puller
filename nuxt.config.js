import {
  relative,
} from 'path';
import cssesc from 'cssesc';
import {
  interpolateName,
} from 'loader-utils';
import normalizePath from 'normalize-path';
import ShortUniqueId from 'short-unique-id';

// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\x00-\x1F]/g;
// eslint-disable-next-line no-control-regex
const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g;
const reRelativePath = /^\.+/;

const uid = new ShortUniqueId();

const identNameMap = {};

const isProd = 'production' === process.env.NODE_ENV;

function meta(name, content) {
  return {
    hid: name,
    name,
    content,
  };
}

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
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
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
    ],
    script: [
      {
        innerHTML: 'window.goatcounter={no_onload: true}',
        type: 'text/javascript',
        charset: 'utf-8',
      },
      {
        'src': '//gc.zgo.at/count.js',
        'data-goatcounter': process.env.THREADPULLER_GOATCOUNTER_URL,
        'async': true,
      },
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

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    {
      src: '~plugins/add-client-polyfill.js',
      ssr: false,
    },
    '~/plugins/load-settings-from-cookie',
    '~/plugins/add-v-focus-directive',
    '~/plugins/add-linkify-directive',
    {
      src: '~plugins/share-vuex-settings-mutations.js',
      ssr: false,
    },
    {
      src: '~plugins/analytics/goatcounter.js',
      ssr: false,
    },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/eslint-module',
    '@nuxtjs/stylelint-module',
    '@aceforth/nuxt-optimized-images',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    'nuxt-svg-loader',
    [ 'cookie-universal-nuxt', { parseJSON: false } ],
    '@nuxtjs/router-extras',
    '~/modules/4chan/refresher',
    '~/modules/presence',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en',
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {

    /*
     ** Update loader configurations
     */
    loaders: {
      cssModules: {
        modules: {
          localIdentName: '[path][name]__[local]',
          getLocalIdent({
            resource: _resource,
            ...loaderContext
          }, localIdentName, localName, options) {
            if (!options.context) {
              // eslint-disable-next-line no-param-reassign
              options.context = loaderContext.rootContext;
            }

            const request = normalizePath(
              relative(options.context || '', loaderContext.resourcePath),
            );

            // eslint-disable-next-line no-param-reassign
            options.content = `${ options.hashPrefix + request }+${ unescape(localName) }`;

            const parsedLocalIdentName = cssesc(
              interpolateName(loaderContext, localIdentName, options)
                // For `[hash]` placeholder
                .replace(/^((-?[0-9])|--)/, '_$1')
                .replace(filenameReservedRegex, '-')
                .replace(reControlChars, '-')
                .replace(reRelativePath, '-')
                .replace(/\./g, '-'),
              { isIdentifier: true },
            ).replace(/\\\[local\\]/gi, localName);

            if (!(parsedLocalIdentName in identNameMap)) {
              const id = cssesc(uid.sequentialUUID());

              if (/^\d+/.test(id)) {
                identNameMap[ parsedLocalIdentName ] = `_${ id }`;
              } else {
                identNameMap[ parsedLocalIdentName ] = id;
              }
            }

            const className = identNameMap[ parsedLocalIdentName ];

            if (isProd) {
              return className;
            } else {
              return `${ parsedLocalIdentName }__${ className }`;
            }
          },
        },
      },

      vue: {
        video: [ 'src', 'poster' ],
        source: 'src',
        img: 'src',
        image: [ 'xlink:href', 'href' ],
        use: [ 'xlink:href', 'href' ],
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
