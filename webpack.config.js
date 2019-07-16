const Encore = require('@symfony/webpack-encore');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CopyWebpackPlugin = require('copy-webpack-plugin');
// noinspection NpmUsedModulesInstalled
const webpack = require('webpack');

const ImageminMozjpeg = require('imagemin-mozjpeg');

Encore
// directory where compiled assets will be stored
    .setOutputPath('./public/static/')
    // public path used by the web server to access the output path
    .setPublicPath('/static')
    // only needed for CDN's or sub-directory deploy
    // .setManifestKeyPrefix('')

    /*
     * ENTRY CONFIG
     *
     * Add 1 entry for each "page" of your app
     * (including one that's included on every page - e.g. "app")
     *
     * Each entry will result in one JavaScript file (e.g. app.js)
     * and one CSS file (e.g. app.css) if your JavaScript imports CSS.
     */
    .addEntry('App', './static/js/App.js')
    .addEntry('Board', './static/js/Board.js')
    .addEntry('Download', './static/js/Download.js')
    .addEntry('Presence', './static/js/Presence.js')
    .addEntry('Settings', './static/js/Settings.js')
    .addEntry('Stalker', './static/js/Stalker.js')
    .addEntry('Thread', './static/js/Thread.js')
    .addEntry('Login', './static/js/Login.js')
    .addEntry('Index', './static/js/Index.js')

    // will require an extra script tag for runtime.js
    // but, you probably want this, unless you're building a single-page app
    .enableSingleRuntimeChunk()
    // .disableSingleRuntimeChunk()

    .splitEntryChunks()

    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())

    // enables hashed filenames (e.g. app.abc123.css)
    .enableVersioning(Encore.isProduction())

    // uncomment if you use TypeScript
    //.enableTypeScriptLoader()

    // uncomment if you're having problems with a jQuery plugin
    //.autoProvidejQuery()

    // uncomment if you use Sass/SCSS files
    .enableSassLoader((options) => {
        options.outputStyle = 'compressed';

        return options;
    })

    .enablePostCssLoader()
    .enableVueLoader()

    .addPlugin(new CopyWebpackPlugin([
        {
            from: 'static/images/images',
        },
    ]))

    .addPlugin(new ImageminPlugin({
        test: /\.(jpe?g|png|gif|svg)$/i,
        optipng: { optimizationLevel: 3 },
        // pngquant: { speed: 1, strip: true },
        gifsicle: { optimizationLevel: 3, interlaced: true },
        plugins: [
            ImageminMozjpeg({
                quality: 95,
                progressive: true,
            }),
        ],
    }))

    .copyFiles({
        from: './static/images',
        includeSubdirectories: false,
        to: '../[path][name].[ext]',
    })
;

const config = Encore.getWebpackConfig();

config.resolve.alias[ 'vue$' ] = 'vue/dist/vue.esm.js';
config.optimization.concatenateModules = true;

module.exports = config;
