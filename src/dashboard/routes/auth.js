const router = require('express').Router();
const passport = require('passport');

router.get('/auth/login', passport.authenticate('discord'));

router.get('/auth/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

router.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;
