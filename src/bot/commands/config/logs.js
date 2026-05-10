const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const { updateGuildSetting, getGuildSettings } = require('../../../database/models/guild');

module.exports = {
    category: 'configuración',
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Configura el canal de logs de moderación')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Establece el canal de logs')
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canal para logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('Desactiva los logs')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const channel = interaction.options.getChannel('canal');
            await updateGuildSetting(interaction.guild.id, 'log_channel', channel.id);
            return interaction.reply({ embeds: [successEmbed(`Canal de logs: ${channel}`)] });
        }

        if (sub === 'off') {
            await updateGuildSetting(interaction.guild.id, 'log_channel', null);
            return interaction.reply({ embeds: [successEmbed('Logs desactivados.')] });
        }
    }
};
