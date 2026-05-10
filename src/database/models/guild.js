const mongoose = require('mongoose');

// ── Schema de configuración del servidor ──
const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: '!' },
    language: { type: String, default: 'es' },

    // plugins habilitados
    plugins: {
        welcome: { type: Boolean, default: false },
        leave: { type: Boolean, default: false },
        autorole: { type: Boolean, default: false },
        moderation: { type: Boolean, default: true },
        logs: { type: Boolean, default: false },
        levels: { type: Boolean, default: false },
        starboard: { type: Boolean, default: false },
        reactionRoles: { type: Boolean, default: false }
    },

    // bienvenidas
    welcome_channel: { type: String, default: null },
    welcome_message: { type: String, default: null },
    welcome_card: { type: Boolean, default: true },
    welcome_card_bg: { type: String, default: '#000000' },
    welcome_card_image: { type: String, default: null },
    welcome_card_text: { type: String, default: null },
    welcome_dm: { type: Boolean, default: false },
    welcome_dm_message: { type: String, default: null },

    // despedidas
    leave_channel: { type: String, default: null },
    leave_message: { type: String, default: null },

    // moderación
    log_channel: { type: String, default: null },
    mod_role: { type: String, default: null },

    // autorole
    autorole: { type: String, default: null },

    // niveles
    levels_channel: { type: String, default: null },
    levels_message: { type: String, default: '¡{user} subió al nivel {level}!' },
    levels_ignored_channels: [{ type: String }],
    levels_ignored_roles: [{ type: String }],
    levels_multiplier: { type: Number, default: 1 },

    // starboard
    starboard_channel: { type: String, default: null },
    starboard_threshold: { type: Number, default: 3 },
    starboard_emoji: { type: String, default: '⭐' },

    // reaction roles
    reaction_roles: [{
        messageId: String,
        channelId: String,
        emoji: String,
        roleId: String
    }]
});

// ── Schema de advertencias ──
const warningSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);
const Warning = mongoose.model('Warning', warningSchema);

// ── Funciones de settings ──

async function getGuildSettings(guildId) {
    let doc = await GuildSettings.findOne({ guildId });

    if (!doc) {
        doc = await GuildSettings.create({ guildId });
    }

    return doc;
}

async function updateGuildSetting(guildId, key, value) {
    const allowed = [
        'prefix', 'welcome_channel', 'welcome_message',
        'leave_channel', 'leave_message', 'log_channel',
        'autorole', 'mod_role', 'language'
    ];

    if (!allowed.includes(key)) return false;

    await GuildSettings.findOneAndUpdate(
        { guildId },
        { [key]: value },
        { upsert: true }
    );

    return true;
}

async function updateGuildSettings(guildId, data) {
    const allowed = [
        'prefix', 'welcome_channel', 'welcome_message',
        'leave_channel', 'leave_message', 'log_channel',
        'autorole', 'mod_role', 'language'
    ];

    const clean = {};
    for (const [key, val] of Object.entries(data)) {
        if (allowed.includes(key)) {
            clean[key] = val;
        }
    }

    if (Object.keys(clean).length === 0) return false;

    await GuildSettings.findOneAndUpdate(
        { guildId },
        clean,
        { upsert: true }
    );

    return true;
}

// ── Funciones de warns ──

async function addWarning(guildId, userId, moderatorId, reason) {
    return Warning.create({ guildId, userId, moderatorId, reason });
}

async function getWarnings(guildId, userId) {
    return Warning.find({ guildId, userId }).sort({ createdAt: -1 });
}

async function clearWarnings(guildId, userId) {
    return Warning.deleteMany({ guildId, userId });
}

module.exports = {
    GuildSettings,
    Warning,
    getGuildSettings,
    updateGuildSetting,
    updateGuildSettings,
    addWarning,
    getWarnings,
    clearWarnings
};
