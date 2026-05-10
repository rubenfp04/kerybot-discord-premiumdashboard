require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { loadCommands } = require('./src/bot/handlers/commandHandler');
const { loadEvents } = require('./src/bot/handlers/eventHandler');
const { connectDatabase } = require('./src/database/db');
const config = require('./config/config.example');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();
client.config = config;

// arrancar todo
(async () => {
    await connectDatabase();
    await loadCommands(client);
    await loadEvents(client);

    client.login(process.env.BOT_TOKEN);

    if (config.dashboard.enabled) {
        const { startDashboard } = require('./src/dashboard/server');
        startDashboard(client);
    }
})();
