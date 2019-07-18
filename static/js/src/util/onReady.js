const data = {
    fired: false,
    list: [],
    handlersInstalled: false,
};

function ready() {
    const { fired, list } = data;

    if (fired)
        return;

    data.fired = true;

    for (const item of list)
        item.fn.call(window, item.ctx);

    data.list = [];
}

function readyStateChange() {
    if (document.readyState === 'complete')
        ready();
}

export function onReady(callback, context = window) {
    if (typeof callback !== 'function')
        throw new TypeError('callback for docReady(fn) must be a function');

    if (data.fired)
        return setTimeout(() => callback(context), 1);

    data.list.push({ fn: callback, ctx: context });

    if (document.readyState === 'complete' || (!document.attachEvent && document.readyState === 'interactive'))
        return setTimeout(ready, 1);

    if (data.handlersInstalled)
        return;

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', ready, false);
        window.addEventListener('load', ready, false);
    } else {
        document.attachEvent('onreadystatechange', readyStateChange);
        window.attachEvent('onload', ready);
    }

    data.handlersInstalled = true;
}
