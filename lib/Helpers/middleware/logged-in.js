/**
 * @param {string} redirectTo
 * @return {Function}
 */
const redirector = function (redirectTo) {
    return handler(function (req, res) {
        req.flash('error', 'You must be logged in to access that page');
        req.session.returnTo = req.originalUrl;
        res.redirect(redirectTo);
    });
};

/**
 * @param {Function} rejectHandler
 * @return {Function}
 */
const handler = function (rejectHandler) {
    return function (req, res, next) {
        if (req.user)
            return next();

        rejectHandler.call(this, req, res);
    };
};

/**
 * @param {string} redirectTo
 * @param {Function} [rejectHandler]
 * @return {*}
 */
module.exports = function (
    {
        redirectTo = '/login',
        rejectHandler = null,
    },
) {
    if (rejectHandler)
        return handler(rejectHandler);

    return redirector(redirectTo);
};
