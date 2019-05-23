const express = require('express');
const Router = express.Router({});
const rateLimit = require('express-rate-limit');
const rateLimitRedis = require('rate-limit-redis');
const passport = require('../../../config/configured-passport');
const requireLoggedIn = require('../../../lib/Helpers/middleware/logged-in');

module.exports = function (redis) {
    const loginRequiredHandler = (req, res) => res.json({ success: false, reason: 'You must be logged in to access this page' });
    const loginRateLimiter = rateLimit(
        {
            store: new rateLimitRedis(
                {
                    client: redis,
                    expiry: 30,
                }),
            max: 10,
            // skipSuccessfulRequests: true,
            keyGenerator(req) {
                const { ip, user = {}, body = {} } = req;
                const { username } = body;
                const { id } = user;

                return id || username || ip;
            },
            message: {
                success: false,
                message: 'Too many requests, please try again later.',
            },
        });

    Router.post('/login', loginRateLimiter, (req, res, next) => {
        if (req.user)
            return res.json({ success: true, message: 'Already logged in' });

        passport.authenticate('local', {}, (_, user, { message = 'Successfully logged in' } = {}) => {
            const success = Boolean(user);

            if (!success)
                return res.json({ success, message });

            req.login(user, () => {
                delete req.session.returnTo;
                res.json({ success, message });
            });
        })(req, res, next);
    });

    Router.use(requireLoggedIn({ rejectHandler: loginRequiredHandler }));

    Router.get('/info', (req, res) => {
        const { username, email } = req.user;

        res.json({ username, email });
    });

    Router.get('/logout', (req, res) => {
        req.logout();
        res.json({ success: true });
    });

    return Router;
};
