module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [

        {
            name: 'ThreadPuller',
            script: './threadpuller2.js',
            watch: [
                './threadpuller2.js',
                './lib/',
                './.env'
            ],
            cwd: __dirname,
        },
    ],
};
