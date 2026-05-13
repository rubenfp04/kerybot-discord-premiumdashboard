const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages from a channel')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption(opt => opt.setName('user').setDescription('Delete only messages from this user'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const amount = interaction.options.getInteger('amount');
        const target = interaction.options.getUser('user');

        let messages = await interaction.channel.messages.fetch({ limit: amount });
        if (target) messages = messages.filter(m => m.author.id === target.id);

        const deleted = await interaction.channel.bulkDelete(messages, true);

        const userSuffix = target ? ` (from ${target.tag})` : '';
        return interaction.reply({
            embeds: [successEmbed(t('clear.success', { count: deleted.size, userSuffix }))],
            ephemeral: true
        });
    }
};
