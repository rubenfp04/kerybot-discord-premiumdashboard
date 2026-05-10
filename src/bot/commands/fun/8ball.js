const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

const respuestas = [
    'Sí, definitivamente.',
    'Sin duda.',
    'Probablemente sí.',
    'Las señales apuntan a que sí.',
    'Yo creo que sí.',
    'Puede ser.',
    'No estoy seguro.',
    'Mejor no te lo digo ahora.',
    'Concéntrate y vuelve a preguntar.',
    'No cuentes con ello.',
    'Probablemente no.',
    'Definitivamente no.',
    'Las perspectivas no son buenas.',
    'Muy dudoso.',
    'Ni de broma.'
];

module.exports = {
    category: 'diversión',
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Hazle una pregunta a la bola mágica')
        .addStringOption(opt => opt.setName('pregunta').setDescription('Tu pregunta').setRequired(true)),

    async execute(interaction) {
        const pregunta = interaction.options.getString('pregunta');
        const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

        return interaction.reply({
            embeds: [createEmbed({
                title: '🎱 Bola Mágica',
                fields: [
                    { name: 'Pregunta', value: pregunta },
                    { name: 'Respuesta', value: respuesta }
                ]
            })]
        });
    }
};
