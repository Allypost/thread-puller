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
    },

    serverMiddleware: [
        '~/api/4chan',
        '~/api/4chan-images',
    ],

    /*
     ** Customize the progress-bar color
     */
    isLoading: { color: '#ffffff' },
    /*
     ** Global CSS
     */
    css: [],
    /*
     ** Plugins to load before mounting the App
     */
    plugins: [],
    /*
     ** Nuxt.js dev-modules
     */
    devModules: [
        // Doc: https://github.com/nuxt-community/eslint-module
        '@nuxtjs/eslint-module',
    ],
    /*
     ** Nuxt.js modules
     */
    modules: [
        // Doc: https://axios.nuxtjs.org/usage
        '@nuxtjs/axios',
        '@nuxtjs/pwa',
        '@bazzite/nuxt-optimized-images',
        'nuxt-svg-loader',
        [ 'cookie-universal-nuxt', { parseJSON: false } ],
        [ '@nuxtjs/router', { keepDefaultRouter: true } ],
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

        filenames: {
            app: ({ isDev }) => isDev ? '[name].js' : '[chunkhash].js',
            chunk: ({ isDev }) => isDev ? '[name].js' : '[id].[chunkhash].js',
            css: ({ isDev }) => isDev ? '[name].css' : '[contenthash].css',
            img: ({ isDev }) => isDev ? '[path][name].[ext]' : 'img/[hash].[ext]',
            font: ({ isDev }) => isDev ? '[path][name].[ext]' : 'fonts/[hash].[ext]',
            video: ({ isDev }) => isDev ? '[path][name].[ext]' : 'videos/[hash].[ext]',
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
    },
    optimizedImages: {
        optimizeImages: true,
    },
};
