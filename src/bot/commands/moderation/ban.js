const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason specified';

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed(t('ban.notFound'))], ephemeral: true });
        }

        if (!target.bannable) {
            return interaction.reply({ embeds: [errorEmbed(t('ban.cantBan'))], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed(t('ban.selfBan'))], ephemeral: true });
        }

        await target.ban({ reason: `${reason} | By: ${interaction.user.tag}` });

        return interaction.reply({
            embeds: [successEmbed(t('ban.success', { tag: target.user.tag, reason }))]
        });
    }
};
