const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'moderación',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Razón de la expulsión'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razón') || 'Sin razón especificada';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario.')], ephemeral: true });
        }

        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed('No puedo expulsar a este usuario.')], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed('No te puedes expulsar a ti mismo.')], ephemeral: true });
        }

        await target.kick(`${reason} | Por: ${interaction.user.tag}`);

        return interaction.reply({
            embeds: [successEmbed(`**${target.user.tag}** ha sido expulsado.\n**Razón:** ${reason}`)]
        });
    }
};
