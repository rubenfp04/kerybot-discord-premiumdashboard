const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getGuildSettings, updateGuildSettings } = require('../../../database/models/guild');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'configuration',
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure the welcome system')
        .addSubcommand(sub => sub.setName('channel').setDescription('Set the welcome channel')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel for welcomes').setRequired(true)))
        .addSubcommand(sub => sub.setName('message').setDescription('Set the welcome message')
            .addStringOption(opt => opt.setName('message').setDescription('Use {user} for mention, {server} for server name, {count} for members').setRequired(true)))
        .addSubcommand(sub => sub.setName('off').setDescription('Disable welcomes'))
        .addSubcommand(sub => sub.setName('test').setDescription('Test the current welcome message'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const sub = interaction.options.getSubcommand();

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            await updateGuildSettings(interaction.guildId, { welcome_channel: channel.id, 'plugins.welcome': true });
            return interaction.reply({ embeds: [successEmbed(t('welcome.channelSet', { channel: `${channel}` }))], ephemeral: true });
        }

        if (sub === 'message') {
            const message = interaction.options.getString('message');
            await updateGuildSettings(interaction.guildId, { welcome_message: message });
            return interaction.reply({ embeds: [successEmbed(t('welcome.messageUpdated'))], ephemeral: true });
        }

        if (sub === 'off') {
            await updateGuildSettings(interaction.guildId, { 'plugins.welcome': false });
            return interaction.reply({ embeds: [successEmbed(t('welcome.disabled'))], ephemeral: true });
        }

        if (sub === 'test') {
            const settings = await getGuildSettings(interaction.guildId);
            if (!settings.welcome_channel || !settings.welcome_message) {
                return interaction.reply({ embeds: [errorEmbed(t('welcome.noConfig'))], ephemeral: true });
            }

            const msg = settings.welcome_message
                .replace('{user}', interaction.user)
                .replace('{server}', interaction.guild.name)
                .replace('{count}', interaction.guild.memberCount);

            const embed = new EmbedBuilder()
                .setTitle(t('welcome.previewTitle'))
                .setDescription(msg)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setColor(0x00e5ff);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
