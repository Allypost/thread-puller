const formatText = require('string-kit').format;

class SimpleLogger {

    static dater() {
        return (new Date).toISOString();
    }

    static info(...args) {
        SimpleLogger.clearLine();
        console.log(SimpleLogger.dater(), '|', ...args);
    };

    static log(...args) {
        SimpleLogger.clearLine();
        console.log(SimpleLogger.fmt`^-|>^ `, ...args);
    }

    static moveUpLines(numLines = 1) {
        process.stdout.write(`\x1b[${numLines}F`);
    }

    static moveTo(x = 1, y = 1) {
        [ x, y ] = [ x, y ].map((x) => Math.max(1, x));

        process.stdout.write(`\x1b[${x};${y}H`);
    }

    static clearLine() {
        process.stdout.write('\x1b[2K\r');
    }

    static fmt(str, ...args) {
        const d = (arr, i) => (arr[ i ] === undefined ? '' : arr[ i ]);
        const s = str.map((v, i) => `${v}${d(args, i)}`).join('');

        return formatText(s);
    }

}

module.exports = SimpleLogger;
