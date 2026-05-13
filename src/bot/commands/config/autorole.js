const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getGuildSettings, updateGuildSettings } = require('../../../database/models/guild');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'configuration',
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Manage reaction roles with interactive embeds')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a reaction roles embed in this channel')
            .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('Embed description')))
        .addSubcommand(sub => sub.setName('add').setDescription('Add an emoji-role to an autorole message')
            .addStringOption(opt => opt.setName('message_id').setDescription('Autorole message ID').setRequired(true))
            .addStringOption(opt => opt.setName('emoji').setDescription('Emoji to react with').setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove an emoji-role from an autorole message')
            .addStringOption(opt => opt.setName('message_id').setDescription('Autorole message ID').setRequired(true))
            .addStringOption(opt => opt.setName('emoji').setDescription('Emoji to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('Show configured reaction roles'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const sub = interaction.options.getSubcommand();
        const settings = await getGuildSettings(interaction.guildId);

        if (!settings.reactionRoles) settings.reactionRoles = [];

        if (sub === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description') || t('autorole.defaultDesc');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(0x00e5ff);

            const msg = await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ embeds: [successEmbed(t('autorole.created', { id: msg.id }))], ephemeral: true });
        }

        if (sub === 'add') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');
            const role = interaction.options.getRole('role');

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ embeds: [errorEmbed(t('autorole.roleTooHigh'))], ephemeral: true });
            }

            let msg;
            try {
                msg = await interaction.channel.messages.fetch(messageId);
            } catch {
                return interaction.reply({ embeds: [errorEmbed(t('autorole.msgNotFound'))], ephemeral: true });
            }

            try {
                await msg.react(emoji);
            } catch {
                return interaction.reply({ embeds: [errorEmbed(t('autorole.emojiError'))], ephemeral: true });
            }

            settings.reactionRoles.push({ messageId, emoji, roleId: role.id, channelId: interaction.channel.id });
            await updateGuildSettings(interaction.guildId, { reactionRoles: settings.reactionRoles });

            // Update embed description
            const rrs = settings.reactionRoles.filter(r => r.messageId === messageId);
            const desc = rrs.map(r => `${r.emoji} → <@&${r.roleId}>`).join('\n');
            if (msg.embeds[0]) {
                const updated = EmbedBuilder.from(msg.embeds[0]).setDescription(desc);
                await msg.edit({ embeds: [updated] });
            }

            return interaction.reply({ embeds: [successEmbed(t('autorole.added', { emoji, role: role.name }))], ephemeral: true });
        }

        if (sub === 'remove') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');

            settings.reactionRoles = settings.reactionRoles.filter(r => !(r.messageId === messageId && r.emoji === emoji));
            await updateGuildSettings(interaction.guildId, { reactionRoles: settings.reactionRoles });

            return interaction.reply({ embeds: [successEmbed(t('autorole.removed', { emoji, id: messageId }))], ephemeral: true });
        }

        if (sub === 'list') {
            const rrs = settings.reactionRoles;
            const embed = new EmbedBuilder()
                .setTitle(t('autorole.listTitle'))
                .setColor(0x00e5ff);

            if (!rrs.length) {
                embed.setDescription(t('autorole.noConfig'));
            } else {
                embed.setDescription(t('autorole.activeCount', { count: rrs.length }));
                const grouped = {};
                rrs.forEach(r => {
                    if (!grouped[r.messageId]) grouped[r.messageId] = [];
                    grouped[r.messageId].push(r);
                });
                Object.entries(grouped).forEach(([msgId, roles]) => {
                    embed.addFields({
                        name: t('autorole.messageField', { id: msgId }),
                        value: roles.map(r => `${r.emoji} → <@&${r.roleId}>`).join('\n')
                    });
                });
            }

            return interaction.reply({ embeds: [embed] });
        }
    }
};
