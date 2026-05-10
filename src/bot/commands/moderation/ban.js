const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'moderación',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario del servidor')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Razón del ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razón') || 'Sin razón especificada';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario.')], ephemeral: true });
        }

        if (!target.bannable) {
            return interaction.reply({ embeds: [errorEmbed('No puedo banear a este usuario. Revisa mis permisos o la jerarquía de roles.')], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('No te puedes banear a ti mismo.')], ephemeral: true });
        }

        await target.ban({ reason: `${reason} | Por: ${interaction.user.tag}` });

        return interaction.reply({
            embeds: [successEmbed(`**${target.user.tag}** ha sido baneado.\n**Razón:** ${reason}`)]
        });
    }
};
