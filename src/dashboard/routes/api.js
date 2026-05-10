const router = require('express').Router();
const { getGuildSettings, updateGuildSettings, GuildSettings } = require('../../database/models/guild');
const { PermissionFlagsBits } = require('discord.js');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'No autenticado' });
}

function hasGuildPermission(req, res, next) {
    const userGuild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (!userGuild) return res.status(403).json({ error: 'Sin acceso' });

    const perms = BigInt(userGuild.permissions);
    if ((perms & BigInt(PermissionFlagsBits.ManageGuild)) !== BigInt(PermissionFlagsBits.ManageGuild)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    next();
}

// guardar configuración (soporta campos planos y anidados tipo plugins.welcome)
router.post('/guilds/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const data = req.body;

    const allowed = [
        'prefix', 'welcome_channel', 'welcome_message', 'welcome_card',
        'welcome_card_bg', 'welcome_card_image', 'welcome_card_text',
        'welcome_dm', 'welcome_dm_message',
        'leave_channel', 'leave_message', 'log_channel',
        'autorole', 'mod_role', 'language',
        'levels_channel', 'levels_message', 'levels_multiplier',
        'starboard_channel', 'starboard_threshold', 'starboard_emoji'
    ];

    const pluginKeys = [
        'plugins.welcome', 'plugins.leave', 'plugins.autorole',
        'plugins.moderation', 'plugins.logs', 'plugins.levels',
        'plugins.starboard', 'plugins.reactionRoles'
    ];

    const update = {};

    // campos normales
    for (const key of allowed) {
        if (data[key] !== undefined) {
            update[key] = data[key] === '' ? null : data[key];
        }
    }

    // plugins (boolean)
    for (const key of pluginKeys) {
        if (data[key] !== undefined) {
            update[key] = data[key] === true || data[key] === 'true' || data[key] === 'on';
        }
    }

    if (Object.keys(update).length === 0) {
        return res.json({ success: true });
    }

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: update },
        { upsert: true }
    );

    res.json({ success: true });
});

// toggle individual de plugin
router.post('/guilds/:guildId/plugins', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const { plugin, enabled } = req.body;

    const validPlugins = ['welcome', 'leave', 'autorole', 'moderation', 'logs', 'levels', 'starboard', 'reactionRoles'];
    if (!validPlugins.includes(plugin)) {
        return res.status(400).json({ error: 'Plugin inválido' });
    }

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: { [`plugins.${plugin}`]: !!enabled } },
        { upsert: true }
    );

    res.json({ success: true });
});

// obtener configuración
router.get('/guilds/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    const settings = await getGuildSettings(req.params.guildId);
    res.json(settings);
});

module.exports = router;
