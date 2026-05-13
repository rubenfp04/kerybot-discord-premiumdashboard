const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const categories = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
);

for (const category of categories) {
    const files = fs.readdirSync(path.join(commandsPath, category)).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const command = require(path.join(commandsPath, category, file));
        if (command.data) commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`Registering ${commands.length} slash commands...`);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Commands registered successfully.');
    } catch (err) {
        console.error('Error registering commands:', err);
    }
})();
