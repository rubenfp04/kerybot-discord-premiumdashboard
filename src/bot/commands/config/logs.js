const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const { updateGuildSettings } = require('../../../database/models/guild');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'configuration',
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Configure the moderation log channel')
        .addSubcommand(sub => sub.setName('set').setDescription('Set the log channel')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel for logs').setRequired(true)))
        .addSubcommand(sub => sub.setName('off').setDescription('Disable logs'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const channel = interaction.options.getChannel('channel');
            await updateGuildSettings(interaction.guildId, { log_channel: channel.id, 'plugins.logs': true });
            return interaction.reply({ embeds: [successEmbed(t('logs.setSuccess', { channel: `${channel}` }))], ephemeral: true });
        }

        if (sub === 'off') {
            await updateGuildSettings(interaction.guildId, { 'plugins.logs': false });
            return interaction.reply({ embeds: [successEmbed(t('logs.offSuccess'))], ephemeral: true });
        }
    }
};
