const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utilidad',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Muestra la latencia del bot'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Calculando...', fetchReply: true });
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const ws = interaction.client.ws.ping;

        await interaction.editReply({
            content: null,
            embeds: [createEmbed({
                title: '🏓 Pong!',
                fields: [
                    { name: 'Latencia', value: `${roundtrip}ms`, inline: true },
                    { name: 'API', value: `${ws}ms`, inline: true }
                ]
            })]
        });
    }
};
