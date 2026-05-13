const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildTranslator } = require('../../utils/i18n');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show user information')
        .addUserOption(opt => opt.setName('user').setDescription('User to check')),

    async execute(interaction) {
        const t = await getGuildTranslator(interaction.guildId);
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(0x00e5ff)
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: t('userinfo.accountCreated'), value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: t('userinfo.joined'), value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: t('userinfo.roles'), value: `${member.roles.cache.size - 1}`, inline: true },
                { name: t('userinfo.highestRole'), value: `${member.roles.highest}`, inline: true }
            );
        }

        return interaction.reply({ embeds: [embed] });
    }
};
