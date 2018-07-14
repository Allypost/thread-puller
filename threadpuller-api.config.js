module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        {
            name: 'ThreadPuller API',
            script: './threadpuller-api.js',
            watch: [
                './threadpuller-api.js',
                './lib/',
                './.env'
            ],
            cwd: __dirname,
        },
    ],
};
