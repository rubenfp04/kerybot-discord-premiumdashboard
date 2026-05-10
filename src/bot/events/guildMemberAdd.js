const { getGuildSettings } = require('../../database/models/guild');
const { createEmbed } = require('../utils/embeds');

module.exports = {
    name: 'guildMemberAdd',
    once: false,

    async execute(member, client) {
        const settings = await getGuildSettings(member.guild.id);

        // autorole
        if (settings.plugins?.autorole && settings.autorole) {
            const role = member.guild.roles.cache.get(settings.autorole);
            if (role) {
                await member.roles.add(role).catch(err =>
                    console.error(`[AUTOROLE] No pude asignar rol en ${member.guild.name}:`, err.message)
                );
            }
        }

        // helper: reemplazar variables
        const replaceVars = (text) => text
            .replace(/{user}/g, member)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount);

        // bienvenida en canal
        if (settings.plugins?.welcome && settings.welcome_channel && settings.welcome_message) {
            const channel = member.guild.channels.cache.get(settings.welcome_channel);
            if (channel) {
                const embedData = {
                    title: '👋 Bienvenido/a',
                    description: replaceVars(settings.welcome_message),
                    thumbnail: member.user.displayAvatarURL({ dynamic: true })
                };

                // imagen de tarjeta como imagen del embed
                if (settings.welcome_card && settings.welcome_card_image) {
                    embedData.image = settings.welcome_card_image;
                }

                channel.send({ embeds: [createEmbed(embedData)] }).catch(() => {});
            }
        }

        // DM de bienvenida
        if (settings.welcome_dm && settings.welcome_dm_message) {
            const dmMsg = replaceVars(settings.welcome_dm_message);

            member.send({
                embeds: [createEmbed({
                    title: `Bienvenido/a a ${member.guild.name}`,
                    description: dmMsg,
                    thumbnail: member.guild.iconURL({ dynamic: true })
                })]
            }).catch(() => {
                // el usuario puede tener los DMs cerrados
            });
        }
    }
};
