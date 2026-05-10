const { EmbedBuilder } = require('discord.js');

function createEmbed({ title, description, color, fields, footer, thumbnail, image }) {
    const embed = new EmbedBuilder();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    embed.setColor(color || '#5865F2');
    if (fields) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);

    embed.setFooter({
        text: footer || `rekybot • ${new Date().getFullYear()}`
    });

    embed.setTimestamp();
    return embed;
}

function successEmbed(description) {
    return createEmbed({
        description: `✅ ${description}`,
        color: '#57F287'
    });
}

function errorEmbed(description) {
    return createEmbed({
        description: `❌ ${description}`,
        color: '#ED4245'
    });
}

function warnEmbed(description) {
    return createEmbed({
        description: `⚠️ ${description}`,
        color: '#FEE75C'
    });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warnEmbed };
