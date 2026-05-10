const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, createEmbed } = require('../../utils/embeds');
const { addWarning, getWarnings, clearWarnings } = require('../../../database/models/guild');

module.exports = {
    category: 'moderación',
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Gestiona las advertencias de un usuario')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Añade una advertencia')
                .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
                .addStringOption(opt => opt.setName('razón').setDescription('Razón').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Lista las advertencias de un usuario')
                .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Limpia las advertencias de un usuario')
                .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser('usuario');

        if (sub === 'add') {
            const reason = interaction.options.getString('razón');
            await addWarning(interaction.guild.id, target.id, interaction.user.id, reason);

            const warns = await getWarnings(interaction.guild.id, target.id);
            return interaction.reply({
                embeds: [successEmbed(`**${target.tag}** ha recibido una advertencia.\n**Razón:** ${reason}\n**Total:** ${warns.length} advertencia(s)`)]
            });
        }

        if (sub === 'list') {
            const warns = await getWarnings(interaction.guild.id, target.id);

            if (warns.length === 0) {
                return interaction.reply({
                    embeds: [createEmbed({ description: `**${target.tag}** no tiene advertencias.` })],
                    ephemeral: true
                });
            }

            const list = warns.map((w, i) =>
                `**${i + 1}.** ${w.reason} — <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>`
            ).join('\n');

            return interaction.reply({
                embeds: [createEmbed({
                    title: `Advertencias de ${target.tag}`,
                    description: list
                })]
            });
        }

        if (sub === 'clear') {
            await clearWarnings(interaction.guild.id, target.id);
            return interaction.reply({
                embeds: [successEmbed(`Se limpiaron las advertencias de **${target.tag}**.`)]
            });
        }
    }
};
