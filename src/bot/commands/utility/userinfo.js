const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utilidad',
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Muestra información de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar')),

    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const fields = [
            { name: 'Tag', value: user.tag, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
        ];

        if (member) {
            fields.push(
                { name: 'Se unió', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Roles', value: `${member.roles.cache.size - 1}`, inline: true },
                { name: 'Rol más alto', value: `${member.roles.highest}`, inline: true }
            );
        }

        return interaction.reply({
            embeds: [createEmbed({
                title: user.tag,
                thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
                fields
            })]
        });
    }
};
