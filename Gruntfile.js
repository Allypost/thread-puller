module.exports = grunt => {
    require('dotenv-safe').load(
        {
            allowEmptyValues: true,
        });

    const fs = require('fs');
    const domainLock = [ '.thread-puller.tk' ];

    /**
     * List of files to process
     *
     * Format:
     *   'DESTINATION PATH': [ 'LIST', 'OF', 'PATHS', 'TO', 'FILES' ]
     */
    const JsFileList = {
        // 'public/js/site.min.js': [
        //     'static/js/site.js',
        // ],
    };

    const CssFileList = {
        'public/css/style.min.css': 'static/styles/style.scss',
    };

    const gruntConfig = {
        sass: {
            dist: {
                options: {
                    style: 'compressed',
                },
                files: CssFileList,
            },
        },
        postcss: {
            options: {
                map: true,
                processors: [
                    require('postcss-font-magician')({}),
                    require('pixrem')(),
                    require('autoprefixer')({ browsers: '> 0.01%' }),
                    require('cssnano')(),
                ],
            },
            dist: {
                files: {},
            },
        },
        closurecompiler: {},
        javascript_obfuscator: {
            options: {
                debugProtection: true,
                debugProtectionInterval: true,
                domainLock,
            },
            main: {
                files: {},
            },
        },
        watch: {
            scripts: {
                files: [ 'static/**/*.js', '!static/js/*.min.js' ],
                //tasks: [ 'closurecompiler', 'javascript_obfuscator', 'cleanup' ],
                tasks: [ 'closurecompiler', 'cleanup' ],
                options: {
                    spawn: true,
                },
            },
            styles: {
                files: [ 'static/**/*.scss' ],
                tasks: [ 'sass', 'postcss' ],
                options: {
                    spawn: true,
                },
            },
        },
        imagemin: {
            static: {
                options: {
                    optimizationLevel: 4,
                    svgoPlugins: [
                        {
                            removeViewBox: false,
                        },
                    ],
                    use: [] // Example plugin usage
                },
            },
            dynamic: {
                files: [
                    {
                        expand: true,
                        cwd: 'static/images/',
                        src: [ '**/*.{png,jpg,jpeg,svg,gif}' ],
                        dest: 'public/images/',
                    },
                ],
            },
        },
    };

    if (process.env.NODE_ENV === 'development')
        gruntConfig.javascript_obfuscator.options = {
            //domainLock,
        };

    Object.keys(JsFileList).forEach(final => {
        const name = final.substring(10, final.length - 7);
        const jsFiles = JsFileList[ final ];

        /**
         * CLOSURE COMPILER SETTINGS
         */
        gruntConfig.closurecompiler[ name ] = {
            'options': {
                language_out: 'ECMASCRIPT5',
                create_source_map: false,
            },
            files: {
                [ final ]: jsFiles,
            },
        };

        /**
         * JAVASCRIPT OBFUSCATOR SETTINGS
         */
        gruntConfig.javascript_obfuscator.main.files[ final ] = final;
    });

    Object.keys(CssFileList).forEach(final => {
        gruntConfig.postcss.dist.files[ final ] = final;
    });

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-javascript-obfuscator');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-google-closure-tools-compiler');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    grunt.task.registerTask('cleanup', 'Clean up after tasks', function () {
        let test = 0;

        const done = this.async();
        const deleteFiles = Object.keys(JsFileList)
                                  .map(el => el + '.map');

        if (deleteFiles.length === 0)
            return done(true);

        for (let i = 0; i < deleteFiles.length; i++) {
            test ^= i + 1;

            fs.unlink(deleteFiles[ i ], (err) => {
                if (err && err.code !== 'ENOENT')
                    grunt.log.error('Failed deleting ' + deleteFiles[ i ] + '\t|\t' + err);
                else
                    grunt.log.writeln('Deleted ' + deleteFiles[ i ]);

                test ^= i + 1;

                if (test === 0)
                    done(true);
            });
        }
    });

    //grunt.registerTask('default', [ 'sass', 'postcss', 'closurecompiler', 'javascript_obfuscator', 'cleanup', 'imagemin' ]);
    grunt.registerTask('default', [ 'sass', 'postcss', 'closurecompiler', 'cleanup', 'imagemin' ]);
};
