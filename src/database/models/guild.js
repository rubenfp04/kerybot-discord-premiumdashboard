const mongoose = require('mongoose');

// ── Guild settings schema ──
const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: '!' },
    language: { type: String, default: 'en' },

    // enabled plugins
    plugins: {
        welcome: { type: Boolean, default: false },
        leave: { type: Boolean, default: false },
        autorole: { type: Boolean, default: false },
        moderation: { type: Boolean, default: true },
        logs: { type: Boolean, default: false },
        levels: { type: Boolean, default: false },
        starboard: { type: Boolean, default: false },
        reactionRoles: { type: Boolean, default: false },
        tickets: { type: Boolean, default: false },
        suggestions: { type: Boolean, default: false }
    },

    // welcome
    welcome_channel: { type: String, default: null },
    welcome_message: { type: String, default: null },
    welcome_card: { type: Boolean, default: false },
    welcome_card_bg: { type: String, default: '#000000' },
    welcome_card_image: { type: String, default: null },
    welcome_card_text: { type: String, default: null },
    welcome_card_channel: { type: String, default: null },
    welcome_dm: { type: Boolean, default: false },
    welcome_dm_message: { type: String, default: null },

    // farewell
    leave_channel: { type: String, default: null },
    leave_message: { type: String, default: null },

    // moderation
    log_channel: { type: String, default: null },
    mod_role: { type: String, default: null },

    // automod
    automod: {
        badwords: { type: String, default: 'disabled' },
        repeated: { type: String, default: 'disabled' },
        invites: { type: String, default: 'disabled' },
        links: { type: String, default: 'disabled' },
        caps: { type: String, default: 'disabled' },
        emojis: { type: String, default: 'disabled' },
        spoilers: { type: String, default: 'disabled' },
        mentions: { type: String, default: 'disabled' },
        zalgo: { type: String, default: 'disabled' },
        antispam: { type: String, default: 'disabled' },
        ignoreBots: { type: Boolean, default: true }
    },

    // auto-actions
    automod_actions: {
        warn_threshold: { type: Number, default: 3 },
        warn_action: { type: String, default: 'disabled' },
        warn_duration: { type: Number, default: 0 }
    },

    // autorole
    autorole: { type: String, default: null },

    // levels
    levels_channel: { type: String, default: null },
    levels_message: { type: String, default: '{user} leveled up to level {level}!' },
    levels_type: { type: String, enum: ['text', 'card'], default: 'card' },
    levels_ignored_channels: [{ type: String }],
    levels_ignored_roles: [{ type: String }],
    levels_multiplier: { type: Number, default: 1 },

    // starboard
    starboard_channel: { type: String, default: null },
    starboard_threshold: { type: Number, default: 3 },
    starboard_emoji: { type: String, default: '⭐' },

    // tickets
    tickets_category: { type: String, default: null },
    tickets_log_channel: { type: String, default: null },
    tickets_message: { type: String, default: 'Hello {user}! A team member will assist you shortly.' },
    tickets_support_role: { type: String, default: null },
    tickets_panel_channel: { type: String, default: null },
    tickets_panel_title: { type: String, default: '🎫 Support' },
    tickets_panel_description: { type: String, default: 'Click the button below to open a support ticket.' },
    tickets_panel_color: { type: String, default: '#00e5ff' },
    tickets_panel_button_text: { type: String, default: 'Open ticket' },
    tickets_panel_button_emoji: { type: String, default: '🎫' },
    tickets_max_open: { type: Number, default: 1 },
    tickets_close_message: { type: String, default: 'Ticket closed by {user}.' },

    // suggestions
    suggestions_channel: { type: String, default: null },
    suggestions_approved_channel: { type: String, default: null },
    suggestions_denied_channel: { type: String, default: null },
    suggestions_upvote_emoji: { type: String, default: '👍' },
    suggestions_downvote_emoji: { type: String, default: '👎' },
    suggestions_anonymous: { type: Boolean, default: false },

    // reaction roles
    reaction_roles: [{
        messageId: String,
        channelId: String,
        emoji: String,
        roleId: String
    }],

    // premium
    premium: { type: Boolean, default: false },
    premium_type: { type: String, enum: ['lifetime', 'yearly', 'monthly', null], default: null },
    premium_until: { type: Date, default: null },
    premium_activated_by: { type: String, default: null },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null }
});

// ── Warnings schema ──
const warningSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

// ── User levels schema ──
const userLevelSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    lastMessage: { type: Date, default: null }
});

userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
userLevelSchema.index({ guildId: 1, totalXp: -1 });

const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);
const Warning = mongoose.model('Warning', warningSchema);
const UserLevel = mongoose.model('UserLevel', userLevelSchema);

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
    UserLevel,
    getGuildSettings,
    updateGuildSetting,
    updateGuildSettings,
    addWarning,
    getWarnings,
    clearWarnings
};
