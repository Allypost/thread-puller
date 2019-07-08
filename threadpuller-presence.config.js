module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        {
            name: 'ThreadPuller Presence',
            script: './scripts/threadpuller-presence.js',
            watch: [
                './threadpuller-presence.js',
                './lib/',
                './.env'
            ],
            cwd: __dirname,
        },
    ],
};
