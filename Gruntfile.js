module.exports = grunt => {
    require('dotenv-safe').load(
        {
            allowEmptyValues: true,
        });

    const URL = require('url');
    const siteUrl = URL.parse(process.env.THREADPULLER_DOMAIN_MAIN);
    const domainLock = [ `.${siteUrl.hostname}` ];

    /**
     * List of files to process
     *
     * Format:
     *   'DESTINATION PATH': [ 'LIST', 'OF', 'PATHS', 'TO', 'FILES' ]
     */
    const JsFileList = {
        'public/js/Board.min.js': [
            'static/js/Board.js',
        ],
        'public/js/Thread.min.js': [
            'node_modules/mobile-detect/mobile-detect.min.js',
            'static/js/Thread.js',
        ],
        'public/js/Settings.min.js': [
            'node_modules/proxy-polyfill/proxy.min.js',
            'node_modules/js-cookie/src/js.cookie.js',
            'static/js/Settings.js',
        ],
        'public/js/Download.min.js': [
            'node_modules/proxy-polyfill/proxy.min.js',
            'static/js/Download.js',
        ],
        'public/js/Stalker.min.js': [
            'static/js/Stalker.js',
        ],
        'public/js/App.min.js': [
            'static/js/App.js',
        ],
        'public/js/Presence.min.js': [
            'node_modules/socket.io-client/dist/socket.io.js',
            'static/js/Presence.js',
        ],
    };

    const CssFileList = {
        'public/css/global.min.css': 'static/styles/global.scss',
        'public/css/index.min.css': 'static/styles/index.scss',
        'public/css/board.min.css': 'static/styles/board.scss',
        'public/css/thread.min.css': 'static/styles/thread.scss',
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
                    // require('postcss-font-magician')({}),
                    require('pixrem')(),
                    require('autoprefixer')({ browsers: 'defaults' }),
                    require('cssnano')({ preset: 'advanced' }),
                ],
            },
            dist: {
                files: {},
            },
        },
        'closure-compiler': {},
        'closure-compiler-manual': {},
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
            styles: {
                files: [ 'static/**/*.scss' ],
                tasks: [ 'sass', 'postcss' ],
                options: {
                    spawn: true,
                },
            },
        },
        imagemin: {
            dynamic: {
                files: [
                    {
                        expand: true,
                        cwd: 'static/images/images/',
                        src: [ '*.{png,jpg,jpeg,svg,gif,ico}' ],
                        dest: 'public/images/',
                    },
                    {
                        expand: true,
                        cwd: 'static/images/',
                        src: [ '*.{png,jpg,jpeg,svg,gif,ico}' ],
                        dest: 'public/',
                    },
                ],
                options: {
                    optimizationLevel: 4,
                    svgoPlugins: [
                        {
                            removeViewBox: false,
                        },
                    ],
                    progressive: true,
                    interlaced: true,
                },
            },
        },
    };

    if (process.env.NODE_ENV === 'development')
        gruntConfig.javascript_obfuscator.options = {
            //domainLock,
        };

    Object.entries(JsFileList)
          .forEach(([ finalName, files ]) => {
              const compileName = finalName.substring(finalName.lastIndexOf('/') + 1, finalName.length - '.min.js'.length);

              gruntConfig[ 'closure-compiler-manual' ][ compileName ] = {
                  files: {
                      [ finalName ]: files,
                  },
                  options: {
                      compilation_level: 'SIMPLE',
                      language_in: 'ECMASCRIPT_NEXT',
                      language_out: 'ECMASCRIPT3',
                      use_types_for_optimization: false,
                      rewrite_polyfills: true,
                  },
              };

              gruntConfig[ 'watch' ][ `script:${compileName}` ] = {
                  files,
                  //tasks: [ 'closure-compiler-manual', 'javascript_obfuscator' ],
                  tasks: [ `closure-compiler-manual:${compileName}` ],
                  options: {
                      spawn: true,
                  },
              };

              /**
               * JAVASCRIPT OBFUSCATOR SETTINGS
               */
              gruntConfig.javascript_obfuscator.main.files[ finalName ] = finalName;
          });

    Object.keys(CssFileList).forEach(final => {
        gruntConfig.postcss.dist.files[ final ] = final;
    });

    require('google-closure-compiler').grunt(grunt);

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-javascript-obfuscator');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    grunt.registerMultiTask('closure-compiler-manual', 'Closure compiler alternative that uses raw system calls for compilation', async function () {
        const chalk = require('chalk');
        const exec = require('util').promisify(require('child_process').exec);
        const resolve = require('path').resolve;

        const done = this.async();
        const compilerPath = resolve(require('google-closure-compiler').compiler.COMPILER_PATH);

        const files = this.files.pop();

        const outName = resolve(files.dest);
        const inNames = files.src
                             .map(name => resolve(name))
                             .join('" "');

        const optionsObject = Object.assign({}, this.options(), { js_output_file: outName });
        const options = Object.entries(optionsObject)
                              .map(([ name, value ]) => `--${name}="${value}"`)
                              .join(' ');

        try {
            const { stdout, stderr } = await exec(`java -jar "${compilerPath}" ${options} "${inNames}"`);

            if (stdout)
                grunt.log.writeln(stdout.trim().replace(/^(.*)$/gm, (_, line) => `${chalk.green('>>')} ${line}`));
            if (stderr)
                grunt.log.writeln(stderr.trim().replace(/^(.*)$/gm, (_, line) => `${chalk.red('>>')} ${line}`));

            grunt.log.writeln(`${chalk.green('>>')} ${chalk.cyan(files.dest)} created`);
        } catch (e) {
            const stderr = e.toString();
            grunt.log.writeln(stderr.trim().replace(/^(.*)$/gm, (_, line) => `${chalk.red('>>')} ${line}`));
            grunt.log.writeln(`${chalk.red('>>')} ${chalk.cyan(files.dest)} ${chalk.bold('not')} created`);
        }

        done();
    });

    //grunt.registerTask('default', [ 'sass', 'postcss', 'closure-compiler', 'javascript_obfuscator', 'imagemin' ]);
    grunt.registerTask('default', [ 'sass', 'postcss', 'closure-compiler-manual', 'imagemin' ]);
};
