const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('dado')
        .setDescription('Roll a die')
        .addIntegerOption(opt => opt.setName('faces').setDescription('Number of faces (default 6)').setMinValue(2).setMaxValue(100)),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const faces = interaction.options.getInteger('faces') || 6;
        const value = Math.floor(Math.random() * faces) + 1;

        const embed = new EmbedBuilder()
            .setTitle(t('dado.title'))
            .setDescription(t('dado.result', { faces, value }))
            .setColor(0x00e5ff);

        return interaction.reply({ embeds: [embed] });
    }
};
