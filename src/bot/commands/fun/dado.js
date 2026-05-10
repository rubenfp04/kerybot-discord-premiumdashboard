const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'diversión',
    data: new SlashCommandBuilder()
        .setName('dado')
        .setDescription('Tira un dado')
        .addIntegerOption(opt =>
            opt.setName('caras')
                .setDescription('Número de caras del dado (por defecto 6)')
                .setMinValue(2)
                .setMaxValue(100)
        ),

    async execute(interaction) {
        const caras = interaction.options.getInteger('caras') || 6;
        const resultado = Math.floor(Math.random() * caras) + 1;

        return interaction.reply({
            embeds: [createEmbed({
                title: '🎲 Dado',
                description: `Tiraste un d${caras} y salió **${resultado}**`
            })]
        });
    }
};
