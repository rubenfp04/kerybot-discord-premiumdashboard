const { getGuildSettings } = require('../../database/models/guild');
const { createEmbed } = require('../utils/embeds');
const { generateWelcomeCard } = require('../utils/welcomeCard');

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

                channel.send({ embeds: [createEmbed(embedData)] }).catch(() => {});
            }
        }

        // tarjeta de bienvenida (imagen generada con canvas)
        if (settings.welcome_card) {
            const cardChannelId = settings.welcome_card_channel || settings.welcome_channel;
            const cardChannel = cardChannelId ? member.guild.channels.cache.get(cardChannelId) : null;
            if (cardChannel) {
                try {
                    const cardText = settings.welcome_card_text
                        ? replaceVars(settings.welcome_card_text).replace(/<@!?\d+>/g, member.user.username)
                        : null;

                    const attachment = await generateWelcomeCard({
                        username: member.user.username,
                        avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                        memberCount: member.guild.memberCount,
                        backgroundURL: settings.welcome_card_image || null,
                        text: cardText
                    });

                    await cardChannel.send({ files: [attachment] });
                } catch (err) {
                    console.error(`[WELCOME-CARD] Error generando tarjeta en ${member.guild.name}:`, err.message);
                }
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
