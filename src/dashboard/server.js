const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');

function startDashboard(client) {
    const app = express();
    const port = process.env.DASHBOARD_PORT || 3000;

    // motor de vistas
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // sesiones (guardadas en MongoDB)
    app.use(session({
        secret: process.env.SESSION_SECRET || 'rekybot-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 60 * 60 * 24 // 1 día
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

    // meter el cliente de discord en las requests
    app.use((req, res, next) => {
        req.client = client;
        res.locals.user = req.user || null;
        res.locals.path = req.path;
        next();
    });

    // rutas
    app.use('/', require('./routes/auth'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/api', require('./routes/api'));

    // landing
    app.get('/', (req, res) => {
        res.render('index', {
            botName: client.user?.username || 'rekybot',
            serverCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            commandCount: client.commands.size
        });
    });

    // 404
    app.use((req, res) => {
        res.status(404).render('error', { code: 404, message: 'Página no encontrada' });
    });

    app.listen(port, () => {
        console.log(`[DASHBOARD] Corriendo en http://localhost:${port}`);
    });
}

module.exports = { startDashboard };
