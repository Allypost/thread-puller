module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        {
            name: 'ThreadPuller Web',
            script: './threadpuller-web.js',
            watch: [
                './threadpuller-web.js',
                './lib/',
                './.env'
            ],
            cwd: __dirname,
        },
    ],
};
