const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');
const { t: rawT } = require('../../utils/i18n');

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question')
        .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const question = interaction.options.getString('question');
        const responses = rawT(null, '8ball.responses');
        // Get guild-specific responses
        const guildResponses = t('8ball.responses');
        const localResponses = Array.isArray(guildResponses) ? guildResponses : responses;
        const answer = localResponses[Math.floor(Math.random() * localResponses.length)];

        const embed = new EmbedBuilder()
            .setTitle(t('8ball.title'))
            .setColor(0x00e5ff)
            .addFields(
                { name: t('8ball.question'), value: question },
                { name: t('8ball.answer'), value: answer }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
