const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '..', 'events');
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

    let loaded = 0;

    for (const file of files) {
        const event = require(path.join(eventsPath, file));

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

        loaded++;
    }

    logger.success('EVT', `${loaded} events loaded`);
}

module.exports = { loadEvents };
