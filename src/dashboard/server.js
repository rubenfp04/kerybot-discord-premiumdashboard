const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const cookieParser = require('cookie-parser');
const path = require('path');
const { i18nMiddleware } = require('./i18n');

function startDashboard(client) {
    const app = express();
    const port = process.env.DASHBOARD_PORT || 3000;

    // view engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, 'public')));

    // Stripe webhook needs raw body — mount before express.json
    const stripeRoutes = require('./routes/stripe');
    app.post('/stripe/webhook', stripeRoutes.webhookHandler);

    // Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // i18n
    app.use(i18nMiddleware);

    // sessions (stored in MongoDB)
    app.use(session({
        secret: process.env.SESSION_SECRET || 'kerybot-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 60 * 60 * 24 // 1 day
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            secure: false,
            httpOnly: true
        }
    }));

    // passport discord
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // attach discord client to requests
    app.use((req, res, next) => {
        req.client = client;
        res.locals.user = req.user || null;
        res.locals.path = req.path;
        next();
    });

    // routes
    app.use('/', require('./routes/auth'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/api', require('./routes/api'));
    app.use('/stripe', stripeRoutes.router);

    // landing
    app.get('/', (req, res) => {
        res.render('index', {
            botName: client.user?.username || 'kerybot',
            serverCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            commandCount: client.commands.size
        });
    });

    // 404
    app.use((req, res) => {
        res.status(404).render('error', { code: 404, message: res.locals.t('common.pageNotFound') });
    });

    const { logger } = require('../bot/utils/logger');
    app.listen(port, () => {
        logger.success('DASH', `Dashboard running at http://localhost:${port}`);
    });
}

module.exports = { startDashboard };
