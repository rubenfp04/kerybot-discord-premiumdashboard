const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason specified';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed(t('kick.notFound'))], ephemeral: true });
        }

        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed(t('kick.cantKick'))], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed(t('kick.selfKick'))], ephemeral: true });
        }

        await target.kick(`${reason} | By: ${interaction.user.tag}`);

        return interaction.reply({
            embeds: [successEmbed(t('kick.success', { tag: target.user.tag, reason }))]
        });
    }
};
