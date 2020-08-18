window.requestIdleCallback =
  window.requestIdleCallback ||
  function(cb, options = {}) {
    const start = Date.now();
    const { timeout = 1 } = options;
    return setTimeout(
      () =>
        cb({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, timeout - (Date.now() - start));
          },
        }),
      1,
    );
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  ((id) => clearTimeout(id));


Element.prototype.documentOffsetTop = function() {
  return this.offsetTop + (this.offsetParent ? this.offsetParent.documentOffsetTop() : 0);
};
