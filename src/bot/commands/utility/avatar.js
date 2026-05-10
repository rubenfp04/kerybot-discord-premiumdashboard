const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utilidad',
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Muestra el avatar de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario')),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 512 });

        return interaction.reply({
            embeds: [createEmbed({
                title: `Avatar de ${user.tag}`,
                image: avatarUrl
            })]
        });
    }
};
