const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'moderación',
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Borra mensajes de un canal')
        .addIntegerOption(opt =>
            opt.setName('cantidad')
                .setDescription('Número de mensajes a borrar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(opt => opt.setName('usuario').setDescription('Borrar solo mensajes de este usuario'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('cantidad');
        const target = interaction.options.getUser('usuario');

        await interaction.deferReply({ ephemeral: true });

        let messages = await interaction.channel.messages.fetch({ limit: amount });

        if (target) {
            messages = messages.filter(m => m.author.id === target.id);
        }

        const deleted = await interaction.channel.bulkDelete(messages, true);

        return interaction.editReply({
            embeds: [successEmbed(`Se borraron **${deleted.size}** mensajes.${target ? ` (de ${target.tag})` : ''}`)]
        });
    }
};
