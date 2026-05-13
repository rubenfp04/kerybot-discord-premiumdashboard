const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const result = Math.random() < 0.5 ? t('coinflip.heads') : t('coinflip.tails');

        const embed = new EmbedBuilder()
            .setTitle(t('coinflip.title'))
            .setDescription(t('coinflip.result', { result }))
            .setColor(0xffab40);

        return interaction.reply({ embeds: [embed] });
    }
};
