const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`[BOT] Conectado como ${client.user.tag}`);
        console.log(`[BOT] En ${client.guilds.cache.size} servidores`);

        client.user.setPresence({
            activities: [{
                name: `${client.guilds.cache.size} servidores`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }
};
