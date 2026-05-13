const router = require('express').Router();
const { getGuildSettings, updateGuildSettings, GuildSettings } = require('../../database/models/guild');
const { PermissionFlagsBits } = require('discord.js');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Not authenticated' });
}

function hasGuildPermission(req, res, next) {
    const userGuild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (!userGuild) return res.status(403).json({ error: 'No access' });

    const perms = BigInt(userGuild.permissions);
    if ((perms & BigInt(PermissionFlagsBits.ManageGuild)) !== BigInt(PermissionFlagsBits.ManageGuild)) {
        return res.status(403).json({ error: 'No permissions' });
    }

    next();
}

// save settings (supports flat and nested fields like plugins.welcome)
router.post('/guilds/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const data = req.body;

    const allowed = [
        'prefix', 'welcome_channel', 'welcome_message',
        'welcome_card_bg', 'welcome_card_image', 'welcome_card_text',
        'welcome_card_channel', 'welcome_dm_message',
        'leave_channel', 'leave_message', 'log_channel',
        'autorole', 'mod_role', 'language',
        'levels_channel', 'levels_message', 'levels_multiplier', 'levels_type',
        'starboard_channel', 'starboard_threshold', 'starboard_emoji',
        'tickets_category', 'tickets_log_channel', 'tickets_message', 'tickets_support_role',
        'tickets_panel_channel', 'tickets_panel_title', 'tickets_panel_description',
        'tickets_panel_color', 'tickets_panel_button_text', 'tickets_panel_button_emoji',
        'tickets_max_open', 'tickets_close_message',
        'suggestions_channel', 'suggestions_approved_channel', 'suggestions_denied_channel',
        'suggestions_upvote_emoji', 'suggestions_downvote_emoji'
    ];

    // campos booleanos no-plugin
    const booleanKeys = ['welcome_card', 'welcome_dm', 'automod.ignoreBots', 'suggestions_anonymous'];

    const pluginKeys = [
        'plugins.welcome', 'plugins.leave', 'plugins.autorole',
        'plugins.moderation', 'plugins.logs', 'plugins.levels',
        'plugins.starboard', 'plugins.reactionRoles', 'plugins.tickets',
        'plugins.suggestions'
    ];

    const automodKeys = [
        'automod.badwords', 'automod.repeated', 'automod.invites',
        'automod.links', 'automod.caps', 'automod.emojis',
        'automod.spoilers', 'automod.mentions', 'automod.zalgo',
        'automod.antispam'
    ];

    const automodActionKeys = [
        'automod_actions.warn_threshold', 'automod_actions.warn_action',
        'automod_actions.warn_duration'
    ];

    const update = {};

    // normal fields
    for (const key of allowed) {
        if (data[key] !== undefined) {
            update[key] = data[key] === '' ? null : data[key];
        }
    }

    // boolean fields (non-plugin)
    for (const key of booleanKeys) {
        if (data[key] !== undefined) {
            update[key] = data[key] === true || data[key] === 'true' || data[key] === 'on';
        }
    }

    // plugins (boolean)
    for (const key of pluginKeys) {
        if (data[key] !== undefined) {
            update[key] = data[key] === true || data[key] === 'true' || data[key] === 'on';
        }
    }

    // automod (enum strings)
    const premiumAutomod = ['automod.invites', 'automod.links'];
    const validAutomodValues = ['disabled', 'warn', 'delete', 'mute', 'kick', 'ban'];
    for (const key of automodKeys) {
        if (data[key] !== undefined && validAutomodValues.includes(data[key])) {
            // block premium automod rules without active plan
            if (premiumAutomod.includes(key) && data[key] !== 'disabled') {
                continue; // se valida abajo con el chequeo global de premium
            }
            update[key] = data[key];
        }
    }

    // automod actions
    for (const key of automodActionKeys) {
        if (data[key] !== undefined) {
            if (key.includes('threshold') || key.includes('duration')) {
                update[key] = parseInt(data[key]) || 0;
            } else if (validAutomodValues.includes(data[key])) {
                update[key] = data[key];
            }
        }
    }

    if (Object.keys(update).length === 0) {
        return res.json({ success: true });
    }

    // block premium plugin settings without active plan
    const premiumSettingsKeys = ['levels_channel', 'levels_message', 'levels_multiplier', 'levels_type', 'starboard_channel', 'starboard_threshold', 'starboard_emoji'];
    const premiumPluginKeys = ['plugins.levels', 'plugins.starboard'];
    const premiumAutomodKeys = ['automod.invites', 'automod.links'];
    const hasPremiumChanges = Object.keys(update).some(k =>
        premiumSettingsKeys.includes(k) || premiumPluginKeys.includes(k) ||
        (premiumAutomodKeys.includes(k) && update[k] !== 'disabled')
    );

    if (hasPremiumChanges) {
        const settings = await getGuildSettings(guildId);
        if (!settings.premium) {
            return res.status(403).json({ error: 'Premium required to modify this setting' });
        }
    }

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: update },
        { upsert: true }
    );

    res.json({ success: true });
});

// individual plugin toggle
const premiumPlugins = ['levels', 'starboard'];

router.post('/guilds/:guildId/plugins', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const { plugin, enabled } = req.body;

    const validPlugins = ['welcome', 'leave', 'autorole', 'moderation', 'logs', 'levels', 'starboard', 'reactionRoles', 'tickets', 'suggestions'];
    if (!validPlugins.includes(plugin)) {
        return res.status(400).json({ error: 'Invalid plugin' });
    }

    // block premium plugin activation without active plan
    if (premiumPlugins.includes(plugin) && enabled) {
        const settings = await getGuildSettings(guildId);
        if (!settings.premium) {
            return res.status(403).json({ error: 'Premium required to enable this plugin' });
        }
    }

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: { [`plugins.${plugin}`]: !!enabled } },
        { upsert: true }
    );

    res.json({ success: true });
});

// get settings
router.get('/guilds/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    const settings = await getGuildSettings(req.params.guildId);
    res.json(settings);
});

// ── Reaction Roles ──

router.post('/guilds/:guildId/reaction-roles', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const { messageId, channelId, emoji, roleId } = req.body;

    if (!messageId || !channelId || !emoji || !roleId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { $push: { reaction_roles: { messageId, channelId, emoji, roleId } } },
        { upsert: true }
    );

    res.json({ success: true });
});

router.delete('/guilds/:guildId/reaction-roles/:index', isAuthenticated, hasGuildPermission, async (req, res) => {
    const { guildId, index } = req.params;
    const idx = parseInt(index);

    const settings = await getGuildSettings(guildId);
    if (!settings.reaction_roles || idx < 0 || idx >= settings.reaction_roles.length) {
        return res.status(400).json({ error: 'Invalid index' });
    }

    settings.reaction_roles.splice(idx, 1);
    await settings.save();

    res.json({ success: true });
});

module.exports = router;
