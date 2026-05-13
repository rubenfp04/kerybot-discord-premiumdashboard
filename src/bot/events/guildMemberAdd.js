const { getGuildSettings } = require('../../database/models/guild');
const { createEmbed } = require('../utils/embeds');
const { generateWelcomeCard } = require('../utils/welcomeCard');
const { getTranslator } = require('../utils/i18n');

module.exports = {
    name: 'guildMemberAdd',
    once: false,

    async execute(member, client) {
        const settings = await getGuildSettings(member.guild.id);
        const t = getTranslator(settings.language);

        // autorole
        if (settings.plugins?.autorole && settings.autorole) {
            const role = member.guild.roles.cache.get(settings.autorole);
            if (role) {
                await member.roles.add(role).catch(err =>
                    console.error(t('events.autoroleError', { guild: member.guild.name }), err.message)
                );
            }
        }

        // helper: replace variables
        const replaceVars = (text) => text
            .replace(/{user}/g, member)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount);

        // channel welcome
        if (settings.plugins?.welcome && settings.welcome_channel && settings.welcome_message) {
            const channel = member.guild.channels.cache.get(settings.welcome_channel);
            if (channel) {
                const embedData = {
                    title: t('events.welcomeTitle'),
                    description: replaceVars(settings.welcome_message),
                    thumbnail: member.user.displayAvatarURL({ dynamic: true })
                };

                channel.send({ embeds: [createEmbed(embedData)] }).catch(() => {});
            }
        }

        // welcome card (canvas-generated image)
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
                    console.error(`[WELCOME-CARD] Error in ${member.guild.name}:`, err.message);
                }
            }
        }

        // welcome DM
        if (settings.welcome_dm && settings.welcome_dm_message) {
            const dmMsg = replaceVars(settings.welcome_dm_message);

            member.send({
                embeds: [createEmbed({
                    title: t('events.welcomeDm', { guild: member.guild.name }),
                    description: dmMsg,
                    thumbnail: member.guild.iconURL({ dynamic: true })
                })]
            }).catch(() => {});
        }
    }
};
