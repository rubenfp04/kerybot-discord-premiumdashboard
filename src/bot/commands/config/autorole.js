const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { updateGuildSetting, getGuildSettings } = require('../../../database/models/guild');

module.exports = {
    category: 'configuración',
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configura el rol automático para nuevos miembros')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Establece el autorole')
                .addRoleOption(opt => opt.setName('rol').setDescription('Rol a asignar automáticamente').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('Desactiva el autorole')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const role = interaction.options.getRole('rol');

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    embeds: [errorEmbed('Ese rol está por encima de mi rol más alto. No podré asignarlo.')],
                    ephemeral: true
                });
            }

            await updateGuildSetting(interaction.guild.id, 'autorole', role.id);
            return interaction.reply({ embeds: [successEmbed(`Autorole configurado: ${role}`)] });
        }

        if (sub === 'off') {
            await updateGuildSetting(interaction.guild.id, 'autorole', null);
            return interaction.reply({ embeds: [successEmbed('Autorole desactivado.')] });
        }
    }
};
