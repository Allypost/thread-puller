const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');

function serialize({ id } = {}) {
    return id;
}

async function unserialize(id) {
    const user = await User.findById(id);

    return {
        err: user ? null : 'Can\'t find user',
        res: user,
    };
}

function configure(passport) {
    // Local Strategy
    passport.use(new LocalStrategy({}, async (identifier, password, done) => {
        const user = await User.findByIdentifier(identifier);

        if (!user)
            return done(null, false, { message: 'Invalid username or password' });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return done(null, false, { message: 'Invalid username or password' });

        return done(null, user);
    }));

    passport.serializeUser((user, done) => done(null, serialize(user)));

    passport.deserializeUser((id, done) => unserialize(id).then(({ err, res }) => done(err, res)));
}

module.exports = configure;

module.exports.serialize = serialize;
module.exports.unserialize = unserialize;

