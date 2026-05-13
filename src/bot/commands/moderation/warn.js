const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { addWarning, getWarnings, clearWarnings } = require('../../../database/models/guild');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Manage user warnings')
        .addSubcommand(sub => sub.setName('add').setDescription('Add a warning')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List user warnings')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('clear').setDescription('Clear user warnings')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser('user');

        if (sub === 'add') {
            const reason = interaction.options.getString('reason');
            await addWarning(interaction.guildId, target.id, reason, interaction.user.id);
            const warns = await getWarnings(interaction.guildId, target.id);
            return interaction.reply({
                embeds: [successEmbed(t('warn.success', { tag: target.tag, reason, count: warns.length }))]
            });
        }

        if (sub === 'list') {
            const warns = await getWarnings(interaction.guildId, target.id);
            if (!warns.length) {
                return interaction.reply({ embeds: [errorEmbed(t('warn.noWarns', { tag: target.tag }))], ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle(t('warn.embedTitle', { tag: target.tag }))
                .setColor(0xffab40)
                .setDescription(warns.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> (<t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>)`).join('\n'));
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'clear') {
            await clearWarnings(interaction.guildId, target.id);
            return interaction.reply({
                embeds: [successEmbed(t('warn.cleared', { tag: target.tag }))]
            });
        }
    }
};
