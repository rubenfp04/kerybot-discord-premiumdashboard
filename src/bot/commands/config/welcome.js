const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, createEmbed } = require('../../utils/embeds');
const { getGuildSettings, updateGuildSetting } = require('../../../database/models/guild');

module.exports = {
    category: 'configuración',
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configura el sistema de bienvenida')
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Establece el canal de bienvenida')
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canal para bienvenidas')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Establece el mensaje de bienvenida')
                .addStringOption(opt =>
                    opt.setName('mensaje')
                        .setDescription('Usa {user} para mención, {server} para nombre del server, {count} para miembros')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('Desactiva las bienvenidas')
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Prueba el mensaje de bienvenida actual')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('canal');
            await updateGuildSetting(interaction.guild.id, 'welcome_channel', channel.id);
            return interaction.reply({ embeds: [successEmbed(`Canal de bienvenida: ${channel}`)] });
        }

        if (sub === 'message') {
            const msg = interaction.options.getString('mensaje');
            await updateGuildSetting(interaction.guild.id, 'welcome_message', msg);
            return interaction.reply({ embeds: [successEmbed(`Mensaje de bienvenida actualizado.`)] });
        }

        if (sub === 'off') {
            await updateGuildSetting(interaction.guild.id, 'welcome_channel', null);
            await updateGuildSetting(interaction.guild.id, 'welcome_message', null);
            return interaction.reply({ embeds: [successEmbed('Bienvenidas desactivadas.')] });
        }

        if (sub === 'test') {
            const settings = await getGuildSettings(interaction.guild.id);
            if (!settings.welcome_channel || !settings.welcome_message) {
                return interaction.reply({ embeds: [errorEmbed('No hay bienvenida configurada.')], ephemeral: true });
            }

            const msg = settings.welcome_message
                .replace(/{user}/g, interaction.user)
                .replace(/{server}/g, interaction.guild.name)
                .replace(/{count}/g, interaction.guild.memberCount);

            return interaction.reply({
                embeds: [createEmbed({
                    title: '👋 Vista previa de bienvenida',
                    description: msg
                })]
            });
        }
    }
};
