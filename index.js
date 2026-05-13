require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { loadCommands } = require('./src/bot/handlers/commandHandler');
const { loadEvents } = require('./src/bot/handlers/eventHandler');
const { connectDatabase } = require('./src/database/db');
const { logger, checkForUpdates } = require('./src/bot/utils/logger');
const config = require('./config/config.example');
const pkg = require('./package.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();
client.config = config;

(async () => {
    logger.banner();
    logger.systemInfo();

    await connectDatabase();
    await loadCommands(client);
    await loadEvents(client);

    client.login(process.env.BOT_TOKEN);

    if (config.dashboard.enabled) {
        const { startDashboard } = require('./src/dashboard/server');
        startDashboard(client);
    }

    if (pkg.repository?.url) {
        await checkForUpdates(pkg.repository.url);
    } else {
        logger.info('VER', `Current version: v${pkg.version}`);
    }
})();
