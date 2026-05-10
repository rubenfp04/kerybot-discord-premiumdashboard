module.exports = {
    bot: {
        prefix: '!',
        status: 'online',
        activity: {
            type: 'WATCHING',
            text: '{servers} servidores'
        }
    },

    dashboard: {
        enabled: true,
        port: process.env.DASHBOARD_PORT || 3000
    },

    embeds: {
        color: '#5865F2',
        footer: 'rekybot • {year}'
    },

    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
        info: 'ℹ️'
    }
};
