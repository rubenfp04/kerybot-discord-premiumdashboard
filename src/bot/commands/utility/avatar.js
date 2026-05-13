const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Show a user\'s avatar')
        .addUserOption(opt => opt.setName('user').setDescription('User')),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(t('avatar.title', { tag: user.tag }))
            .setImage(user.displayAvatarURL({ size: 512, dynamic: true }))
            .setColor(0x00e5ff);

        return interaction.reply({ embeds: [embed] });
    }
};
