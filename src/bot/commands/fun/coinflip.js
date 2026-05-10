const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'diversión',
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Lanza una moneda al aire'),

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Cara 🪙' : 'Cruz 🪙';

        return interaction.reply({
            embeds: [createEmbed({
                title: '🪙 Moneda',
                description: `La moneda cayó en... **${result}**`
            })]
        });
    }
};
