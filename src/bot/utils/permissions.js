const { PermissionFlagsBits } = require('discord.js');

function checkPermission(member, permission) {
    return member.permissions.has(permission);
}

function isModerator(member, settings) {
    if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
    if (settings.mod_role && member.roles.cache.has(settings.mod_role)) return true;
    return false;
}

function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

module.exports = { checkPermission, isModerator, isAdmin };
