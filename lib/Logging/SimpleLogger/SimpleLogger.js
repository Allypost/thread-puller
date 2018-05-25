class SimpleLogger {

    static dater() {
        return (new Date).toISOString();
    }

    static info(...args) {
        console.log.apply(SimpleLogger, [ SimpleLogger.dater(), '|', ...args ]);
    };

}

module.exports = SimpleLogger;
