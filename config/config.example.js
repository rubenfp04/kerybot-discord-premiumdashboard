module.exports = {
    bot: {
        prefix: '!',
        status: 'online',
        activity: {
            type: 'WATCHING',
            text: '{servers} servers'
        }
    },

    dashboard: {
        enabled: true,
        port: process.env.DASHBOARD_PORT || 3000
    },

    embeds: {
        color: '#5865F2',
        footer: 'kerybot • {year}'
    },

    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
        info: 'ℹ️'
    }
};
