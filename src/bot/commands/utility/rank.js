const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/embeds');
const { UserLevel } = require('../../../database/models/guild');
const { generateRankCard } = require('../../utils/rankCard');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Show your level card or another user\'s')
        .addUserOption(opt => opt.setName('user').setDescription('User to check')),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const target = interaction.options.getUser('user') || interaction.user;

        const userLevel = await UserLevel.findOne({ guildId: interaction.guildId, userId: target.id });
        if (!userLevel) {
            const msg = target.id === interaction.user.id ? t('rank.noXpSelf') : t('rank.noXp', { target: `<@${target.id}>` });
            return interaction.reply({ embeds: [errorEmbed(msg)], ephemeral: true });
        }

        await interaction.deferReply();

        const allUsers = await UserLevel.find({ guildId: interaction.guildId }).sort({ level: -1, xp: -1 });
        const rank = allUsers.findIndex(u => u.userId === target.id) + 1;

        const { level, xp } = userLevel;
        const requiredXp = 5 * (level * level) + 50 * level + 100;

        const attachment = await generateRankCard({
            username: target.displayName || target.username,
            avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
            level, xp, requiredXp, rank
        }, t);
        return interaction.editReply({ files: [attachment] });
    }
};
