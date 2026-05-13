const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

function xpForLevel(level) {
    return 5 * (level * level) + 50 * level + 100;
}

async function generateRankCard({ username, avatarURL, level, xp, requiredXp, rank, color }, t) {
    const width = 800;
    const height = 220;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const accentColor = color || '#00E5FF';
    const bgColor = '#0d1a2d';
    const bgLight = '#112240';
    const barBg = 'rgba(255,255,255,0.12)';

    // Background
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, width, height, 16);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 16);
    ctx.stroke();

    // Avatar
    const avatarSize = 100;
    const avatarX = 40;
    const avatarY = (height - avatarSize) / 2;

    // Avatar shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = bgLight;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Avatar clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch {
        ctx.fillStyle = bgLight;
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Avatar ring
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text area
    const textX = avatarX + avatarSize + 30;
    const textWidth = width - textX - 40;

    // Username
    ctx.font = 'bold 28px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const displayName = username.length > 22 ? username.substring(0, 22) + '…' : username;
    ctx.fillText(displayName.toUpperCase(), textX, 65);

    // Level + Rank
    ctx.font = 'bold 16px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = accentColor;
    const levelLabel = t ? t('rank.level', { level }) : `Level ${level}`;
    ctx.fillText(levelLabel, textX, 95);

    // Rank
    const rankLabel = t ? t('rank.position', { rank }) : `Position #${rank}`;
    ctx.fillStyle = '#ffab40';
    ctx.font = 'bold 16px "Arial", "Segoe UI", sans-serif';
    ctx.fillText(rankLabel, textX + 100, 95);

    // XP bar background
    const barX = textX;
    const barY = 130;
    const barWidth = textWidth;
    const barHeight = 22;

    ctx.fillStyle = barBg;
    roundRect(ctx, barX, barY, barWidth, barHeight, 11);
    ctx.fill();

    // XP bar fill
    const progress = Math.min(xp / requiredXp, 1);
    const fillWidth = Math.max(barHeight, barWidth * progress);

    ctx.fillStyle = accentColor;
    roundRect(ctx, barX, barY, fillWidth, barHeight, 11);
    ctx.fill();

    // XP text
    ctx.font = 'bold 14px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`${xp} / ${requiredXp} XP`, barX, barY + barHeight + 22);

    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'rank.png' });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

module.exports = { generateRankCard, xpForLevel };
