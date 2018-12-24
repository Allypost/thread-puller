module.exports = function (req, res, next) {
    if (req.user)
        return next();

    req.flash('error', 'You must be logged in to access that page');
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
};
