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
            console.error(`[ERROR] Comando ${interaction.commandName}:`, err);

            const content = { content: 'Hubo un error al ejecutar este comando.', ephemeral: true };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(content);
            } else {
                await interaction.reply(content);
            }
        }
    }
};
