const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show server information'),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const { guild } = interaction;

        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .setColor(0x00e5ff)
            .addFields(
                { name: t('serverinfo.owner'), value: `<@${guild.ownerId}>`, inline: true },
                { name: t('serverinfo.members'), value: `${guild.memberCount}`, inline: true },
                { name: t('serverinfo.roles'), value: `${guild.roles.cache.size}`, inline: true },
                { name: t('serverinfo.channels'), value: `${guild.channels.cache.size}`, inline: true },
                { name: t('serverinfo.boosts'), value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: t('serverinfo.boostLevel'), value: `${guild.premiumTier || t('serverinfo.none')}`, inline: true },
                { name: t('serverinfo.created'), value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'ID', value: guild.id, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
