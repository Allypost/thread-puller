module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        {
            name: 'ThreadPuller API',
            script: './scripts/threadpuller-api.js',
            watch: [
                './threadpuller-api.js',
                './lib/',
                './.env'
            ],
            cwd: __dirname,
        },
    ],
};
