const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

/**
 * Generates a welcome card as an image.
 * @param {Object} options
 * @param {string} options.username - Username
 * @param {string} options.avatarURL - Avatar URL
 * @param {number} options.memberCount - Member number
 * @param {string} [options.backgroundURL] - Background image URL
 * @param {string} [options.text] - Custom text (premium)
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateWelcomeCard({ username, avatarURL, memberCount, backgroundURL, text }) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ── Background ──
    if (backgroundURL) {
        try {
            const bg = await loadImage(backgroundURL);
            // cover: scale and center
            const scale = Math.max(width / bg.width, height / bg.height);
            const sw = bg.width * scale;
            const sh = bg.height * scale;
            ctx.drawImage(bg, (width - sw) / 2, (height - sh) / 2, sw, sh);
        } catch {
            // fallback gradient if image fails
            drawDefaultBg(ctx, width, height);
        }
    } else {
        drawDefaultBg(ctx, width, height);
    }

    // ── Dark overlay for readability ──
    ctx.fillStyle = 'rgba(10, 20, 34, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // ── Circular avatar ──
    const avatarSize = 110;
    const avatarX = width / 2;
    const avatarY = 105;

    // cyan border
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();

    // glow
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // circular clip and draw avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    } catch {
        ctx.fillStyle = '#0e192a';
        ctx.fill();
    }
    ctx.restore();

    // ── Main text ──
    const mainText = text || 'WELCOME';
    ctx.textAlign = 'center';

    // text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.font = 'bold 32px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = '#00E5FF';
    ctx.fillText(mainText.toUpperCase(), width / 2, 195);

    // ── Username ──
    ctx.font = 'bold 22px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(username.toUpperCase(), width / 2, 228);

    // ── Member # ──
    ctx.font = '16px "Arial", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Member #${memberCount}`, width / 2, 260);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // ── Decorative bottom line ──
    const gradient = ctx.createLinearGradient(0, height - 4, width, height - 4);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.3, '#00E5FF');
    gradient.addColorStop(0.7, '#7C4DFF');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - 4, width, 4);

    // ── Generate attachment ──
    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'welcome-card.png' });
}

function drawDefaultBg(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a1422');
    gradient.addColorStop(0.5, '#0e192a');
    gradient.addColorStop(1, '#121f33');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

module.exports = { generateWelcomeCard };
