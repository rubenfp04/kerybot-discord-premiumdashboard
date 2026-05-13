const { ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');
const { t } = require('../utils/i18n');

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        logger.botStats(client);

        client.user.setPresence({
            activities: [{
                name: t('en', 'events.activity', { count: client.guilds.cache.size }),
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }
};
