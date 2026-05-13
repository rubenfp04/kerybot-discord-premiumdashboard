const router = require('express').Router();
const { getGuildSettings } = require('../../database/models/guild');
const { PermissionFlagsBits } = require('discord.js');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
}

function hasGuildAccess(req, res, next) {
    const guild = req.client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');

    const userGuild = req.user.guilds.find(g => g.id === guild.id);
    if (!userGuild) return res.redirect('/dashboard');

    const perms = BigInt(userGuild.permissions);
    if ((perms & BigInt(PermissionFlagsBits.ManageGuild)) !== BigInt(PermissionFlagsBits.ManageGuild)) {
        return res.redirect('/dashboard');
    }

    req.guild = guild;
    next();
}

// user's server list
router.get('/', isAuthenticated, (req, res) => {
    const userGuilds = req.user.guilds.filter(g => {
        const perms = BigInt(g.permissions);
        return (perms & BigInt(PermissionFlagsBits.ManageGuild)) === BigInt(PermissionFlagsBits.ManageGuild);
    });

    const mutualGuilds = userGuilds.map(g => {
        const botGuild = req.client.guilds.cache.get(g.id);
        return {
            ...g,
            botIn: !!botGuild,
            memberCount: botGuild?.memberCount || 0,
            icon: g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith('a_') ? 'gif' : 'png'}?size=128`
                : null
        };
    });

    mutualGuilds.sort((a, b) => (b.botIn ? 1 : 0) - (a.botIn ? 1 : 0));
    res.render('dashboard', { guilds: mutualGuilds });
});

// helper for common guild data
async function getGuildData(req) {
    const guild = req.guild;
    const settings = await getGuildSettings(guild.id);
    const channels = guild.channels.cache
        .filter(c => c.type === 0)
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const categories = guild.channels.cache
        .filter(c => c.type === 4)
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const roles = guild.roles.cache
        .filter(r => r.id !== guild.id && !r.managed)
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
        .sort((a, b) => b.position - a.position);

    return {
        guild: {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true, size: 128 }),
            memberCount: guild.memberCount
        },
        settings,
        channels,
        categories,
        roles
    };
}

// Main panel (plugins overview)
router.get('/:guildId', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('guild', data);
});

// Plugin pages
router.get('/:guildId/welcome', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    data.activeTab = 'mensaje';
    res.render('plugins/welcome', data);
});

router.get('/:guildId/autorole', isAuthenticated, hasGuildAccess, (req, res) => {
    res.redirect(`/dashboard/${req.params.guildId}/reaction-roles`);
});

router.get('/:guildId/moderation', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/moderation', data);
});

router.get('/:guildId/levels', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    if (!data.settings.premium) return res.redirect(`/dashboard/${req.params.guildId}/premium`);
    res.render('plugins/levels', data);
});

router.get('/:guildId/logs', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/logs', data);
});

router.get('/:guildId/tickets', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/tickets', data);
});

router.get('/:guildId/suggestions', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/suggestions', data);
});

router.get('/:guildId/reaction-roles', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/reaction-roles', data);
});

router.get('/:guildId/starboard', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    if (!data.settings.premium) return res.redirect(`/dashboard/${req.params.guildId}/premium`);
    res.render('plugins/starboard', data);
});

router.get('/:guildId/premium', isAuthenticated, hasGuildAccess, async (req, res) => {
    const data = await getGuildData(req);
    res.render('plugins/premium', data);
});

module.exports = router;
