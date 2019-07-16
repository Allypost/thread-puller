module.exports = {
    plugins: [
        require('postcss-font-magician')({}),
        require('pixrem')(),
        require('autoprefixer')({ browsers: 'defaults' }),
        require('cssnano')({ preset: 'default' }),
    ],
};
