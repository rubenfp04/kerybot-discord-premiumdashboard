const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Show bot latency'),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const sent = await interaction.reply({ content: t('ping.calculating'), fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setTitle(t('ping.title'))
            .setColor(0x00e5ff)
            .addFields(
                { name: t('ping.latency'), value: `${latency}ms`, inline: true },
                { name: t('ping.api'), value: `${interaction.client.ws.ping}ms`, inline: true }
            );

        return interaction.editReply({ content: null, embeds: [embed] });
    }
};
