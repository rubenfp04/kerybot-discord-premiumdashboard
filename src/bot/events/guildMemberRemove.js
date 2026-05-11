const { getGuildSettings } = require('../../database/models/guild');
const { createEmbed } = require('../utils/embeds');

module.exports = {
    name: 'guildMemberRemove',
    once: false,

    async execute(member, client) {
        const settings = await getGuildSettings(member.guild.id);

        if (settings.plugins?.leave && settings.leave_channel && settings.leave_message) {
            const channel = member.guild.channels.cache.get(settings.leave_channel);
            if (!channel) return;

            const msg = settings.leave_message
                .replace(/{user}/g, member.user.tag)
                .replace(/{server}/g, member.guild.name)
                .replace(/{count}/g, member.guild.memberCount);

            channel.send({
                embeds: [createEmbed({
                    title: '👋 Adiós',
                    description: msg,
                    color: '#ED4245'
                })]
            }).catch(() => {});
        }
    }
};
