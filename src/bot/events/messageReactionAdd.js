const { getGuildSettings } = require('../../database/models/guild');

module.exports = {
    name: 'messageReactionAdd',
    once: false,

    async execute(reaction, user) {
        if (user.bot) return;

        // fetch partials
        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }
        if (reaction.message.partial) {
            try { await reaction.message.fetch(); } catch { return; }
        }

        const guild = reaction.message.guild;
        if (!guild) return;

        const settings = await getGuildSettings(guild.id);
        if (!settings.plugins?.reactionRoles) return;

        const rrs = settings.reaction_roles || [];
        const emoji = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.toString();

        const match = rrs.find(rr =>
            rr.messageId === reaction.message.id &&
            (rr.emoji === emoji || rr.emoji === reaction.emoji.toString())
        );

        if (!match) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        await member.roles.add(match.roleId).catch(() => {});
    }
};
