const { getGuildTranslator } = require('../utils/i18n');

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(`[ERROR] Command ${interaction.commandName}:`, err);

            const t = await getGuildTranslator(interaction.guildId);
            const content = { content: t('events.commandError'), ephemeral: true };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(content);
            } else {
                await interaction.reply(content);
            }
        }
    }
};
