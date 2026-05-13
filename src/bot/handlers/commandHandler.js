const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const categories = fs.readdirSync(commandsPath).filter(f =>
        fs.statSync(path.join(commandsPath, f)).isDirectory()
    );

    let loaded = 0;

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const command = require(path.join(categoryPath, file));

            if (!command.data || !command.execute) {
                logger.warn('CMD', `Command ${file} is missing data or execute, skipping.`);
                continue;
            }

            client.commands.set(command.data.name, command);
            loaded++;
        }
    }

    logger.success('CMD', `${loaded} commands in ${categories.length} categories`);
}

function getCommandList(client) {
    const commands = {};
    client.commands.forEach((cmd) => {
        const cat = cmd.category || 'uncategorized';
        if (!commands[cat]) commands[cat] = [];
        commands[cat].push({
            name: cmd.data.name,
            description: cmd.data.description
        });
    });
    return commands;
}

module.exports = { loadCommands, getCommandList };
