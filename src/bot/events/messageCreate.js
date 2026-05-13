const { getGuildSettings, UserLevel } = require('../../database/models/guild');
const { generateRankCard, xpForLevel } = require('../utils/rankCard');
const { createEmbed } = require('../utils/embeds');
const { getTranslator } = require('../utils/i18n');

const cooldowns = new Map();

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const settings = await getGuildSettings(message.guild.id);
        if (!settings.plugins?.levels) return;

        // Ignored channels/roles
        if (settings.levels_ignored_channels?.includes(message.channel.id)) return;
        if (settings.levels_ignored_roles?.some(r => message.member?.roles.cache.has(r))) return;

        // Cooldown: 60s per user per guild
        const key = `${message.guild.id}-${message.author.id}`;
        const now = Date.now();
        if (cooldowns.has(key) && now - cooldowns.get(key) < 60000) return;
        cooldowns.set(key, now);

        // XP gain: 15-25 * multiplier
        const baseXp = Math.floor(Math.random() * 11) + 15;
        const xpGain = Math.floor(baseXp * (settings.levels_multiplier || 1));

        let userLevel = await UserLevel.findOne({
            guildId: message.guild.id,
            userId: message.author.id
        });

        if (!userLevel) {
            userLevel = await UserLevel.create({
                guildId: message.guild.id,
                userId: message.author.id,
                xp: 0,
                level: 0,
                totalXp: 0
            });
        }

        userLevel.xp += xpGain;
        userLevel.totalXp += xpGain;
        userLevel.lastMessage = new Date();

        const requiredXp = xpForLevel(userLevel.level);

        // Level up check
        if (userLevel.xp >= requiredXp) {
            userLevel.level += 1;
            userLevel.xp -= requiredXp;

            await userLevel.save();

            const t = getTranslator(settings.language);

            // Send level-up message
            const targetChannel = settings.levels_channel
                ? message.guild.channels.cache.get(settings.levels_channel)
                : message.channel;

            if (!targetChannel) return;

            const levelType = settings.levels_type || 'card';

            if (levelType === 'card') {
                // Rank position
                const rank = await UserLevel.countDocuments({
                    guildId: message.guild.id,
                    totalXp: { $gt: userLevel.totalXp }
                }) + 1;

                const card = await generateRankCard({
                    username: message.author.displayName || message.author.username,
                    avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
                    level: userLevel.level,
                    xp: userLevel.xp,
                    requiredXp: xpForLevel(userLevel.level),
                    rank
                });

                targetChannel.send({
                    content: t('events.levelUp', { user: `${message.author}`, level: userLevel.level }),
                    files: [card]
                }).catch(() => {});
            } else {
                // Plain text
                const text = (settings.levels_message || t('events.defaultLevelMsg'))
                    .replace(/{user}/g, message.author)
                    .replace(/{level}/g, userLevel.level);

                targetChannel.send(text).catch(() => {});
            }
        } else {
            await userLevel.save();
        }
    }
};
