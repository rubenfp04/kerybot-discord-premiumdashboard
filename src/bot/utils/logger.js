const pkg = require('../../../package.json');

const c = {
    reset:    '\x1b[0m',
    bold:     '\x1b[1m',
    dim:      '\x1b[2m',
    cyan:     '\x1b[36m',
    green:    '\x1b[32m',
    yellow:   '\x1b[33m',
    red:      '\x1b[31m',
    magenta:  '\x1b[35m',
    blue:     '\x1b[34m',
    white:    '\x1b[37m',
    gray:     '\x1b[90m',
    bgCyan:   '\x1b[46m',
    bgGreen:  '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgRed:    '\x1b[41m',
};

const LINE_W = 48;

function timestamp() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function badge(label, bg) {
    return `${bg}${c.bold} ${label.toUpperCase().padEnd(6)} ${c.reset}`;
}

function formatBytes(bytes) {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

const logger = {
    info(label, msg) {
        console.log(`  ${c.gray}${timestamp()}${c.reset}  ${badge(label, c.bgCyan)}  ${msg}`);
    },
    success(label, msg) {
        console.log(`  ${c.gray}${timestamp()}${c.reset}  ${badge(label, c.bgGreen)}  ${c.green}${msg}${c.reset}`);
    },
    warn(label, msg) {
        console.log(`  ${c.gray}${timestamp()}${c.reset}  ${badge(label, c.bgYellow)}  ${c.yellow}${msg}${c.reset}`);
    },
    error(label, msg) {
        console.log(`  ${c.gray}${timestamp()}${c.reset}  ${badge(label, c.bgRed)}  ${c.red}${msg}${c.reset}`);
    },
    divider() {
        console.log(`  ${c.gray}${'─'.repeat(LINE_W)}${c.reset}`);
    },

    section(title) {
        const dashes = LINE_W - title.length - 3;
        console.log(`  ${c.cyan}┬${c.reset} ${c.bold}${c.cyan}${title}${c.reset} ${c.gray}${'─'.repeat(Math.max(0, dashes))}${c.reset}`);
    },

    field(key, value) {
        console.log(`  ${c.cyan}│${c.reset}  ${c.white}${key.padEnd(16)}${c.reset}${c.gray}${value}${c.reset}`);
    },

    sectionEnd() {
        console.log(`  ${c.cyan}┴${c.gray}${'─'.repeat(LINE_W - 1)}${c.reset}`);
    },

    banner() {
        const W = 42;
        const fill = (s) => s + ' '.repeat(Math.max(0, W - s.length));

        const art = [
            '   ╦═╗╔═╗╦╔═╦ ╦╔╗ ╔═╗╔╦╗',
            '   ╠╦╝║╣ ╠╩╗╚╦╝╠╩╗║ ║ ║ ',
            '   ╩╚═╚═╝╩ ╩ ╩ ╚═╝╚═╝ ╩ ',
        ];

        const ver = `v${pkg.version}`;
        const by  = 'by rfernandez';
        const left = `   ${ver}`;
        const right = `${by}   `;
        const gap = Math.max(1, W - left.length - right.length);
        const verLine = `${left}${' '.repeat(gap)}${right}`;

        console.log('');
        console.log(`  ${c.cyan}╔${'═'.repeat(W)}╗${c.reset}`);
        console.log(`  ${c.cyan}║${' '.repeat(W)}║${c.reset}`);
        art.forEach((line, i) => {
            const style = i === 0 ? `${c.bold}${c.cyan}` : c.cyan;
            console.log(`  ${c.cyan}║${c.reset}${style}${fill(line)}${c.reset}${c.cyan}║${c.reset}`);
        });
        console.log(`  ${c.cyan}║${' '.repeat(W)}║${c.reset}`);
        console.log(`  ${c.cyan}║${c.reset}${c.dim}${c.gray}${fill(verLine)}${c.reset}${c.cyan}║${c.reset}`);
        console.log(`  ${c.cyan}║${' '.repeat(W)}║${c.reset}`);
        console.log(`  ${c.cyan}╚${'═'.repeat(W)}╝${c.reset}`);
        console.log('');
    },

    systemInfo() {
        const djs = require('discord.js');
        const mem = process.memoryUsage();

        logger.section('System');
        logger.field('Node.js', process.version);
        logger.field('Discord.js', `v${djs.version}`);
        logger.field('Platform', `${process.platform} (${process.arch})`);
        logger.field('PID', `${process.pid}`);
        logger.field('Memory', formatBytes(mem.rss));
        logger.sectionEnd();
        console.log('');
    },

    botStats(client) {
        const mem = process.memoryUsage();

        console.log('');
        logger.section('Bot Online');
        logger.field('User', client.user.tag);
        logger.field('Servers', client.guilds.cache.size.toLocaleString('en-US'));
        logger.field('Users', client.users.cache.size.toLocaleString('en-US'));
        logger.field('Channels', client.channels.cache.size.toLocaleString('en-US'));
        logger.field('Commands', `${client.commands.size} loaded`);
        logger.field('Memory', formatBytes(mem.rss));
        logger.sectionEnd();
        console.log('');
    }
};

async function checkForUpdates(repoUrl) {
    if (!repoUrl) {
        logger.info('VER', `Current version: v${pkg.version}`);
        return;
    }

    try {
        const https = require('https');

        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            logger.info('VER', `Current version: v${pkg.version}`);
            return;
        }

        const [, owner, repo] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo.replace('.git', '')}/releases/latest`;

        const headers = { 'User-Agent': 'kerybot' };
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const data = await new Promise((resolve, reject) => {
            https.get(apiUrl, { headers }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try { resolve(JSON.parse(body)); }
                        catch { resolve(null); }
                    } else {
                        resolve(null);
                    }
                });
            }).on('error', reject);
        });

        if (!data?.tag_name) {
            logger.warn('VER', `Could not check for updates (v${pkg.version})`);
            return;
        }

        const latest = data.tag_name.replace(/^v/, '');

        if (latest !== pkg.version) {
            console.log('');
            logger.warn('UPDATE', `New version available: v${latest} (current: v${pkg.version})`);
            logger.info('UPDATE', `Download: ${c.cyan}${c.bold}${data.html_url}${c.reset}`);
            logger.divider();
        } else {
            logger.success('VER', `Up to date (v${pkg.version})`);
        }
    } catch (err) {
        logger.warn('VER', `Update check failed (v${pkg.version})`);
    }
}

module.exports = { logger, checkForUpdates, colors: c };
