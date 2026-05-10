const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utilidad',
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Muestra información del servidor'),

    async execute(interaction) {
        const { guild } = interaction;

        const embed = createEmbed({
            title: guild.name,
            thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
            fields: [
                { name: 'Dueño', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Canales', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Nivel de boost', value: `${guild.premiumTier || 'Ninguno'}`, inline: true },
                { name: 'Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'ID', value: guild.id, inline: true }
            ]
        });

        return interaction.reply({ embeds: [embed] });
    }
};
