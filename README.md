# kerybot 🤖

[![GitHub release](https://img.shields.io/github/v/release/rubenfp04/kerybot-discord-premiumdashboard?style=flat-square&color=00e5ff)](https://github.com/rubenfp04/kerybot-discord-premiumdashboard/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/rubenfp04/kerybot-discord-premiumdashboard/total?style=flat-square&color=7C4DFF&label=downloads)](https://github.com/rubenfp04/kerybot-discord-premiumdashboard/releases)
[![License](https://img.shields.io/github/license/rubenfp04/kerybot-discord-premiumdashboard?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%2B-brightgreen?style=flat-square)](https://nodejs.org)

Discord bot with a web dashboard for server management, moderation, levels, tickets, suggestions, and more.

## Features

- **Moderation** — Ban, kick, warn, clear messages, automod rules
- **Welcome & Farewell** — Custom messages, welcome cards (canvas), DMs, autorole
- **Levels** — XP system with rank cards, multipliers, ignored channels/roles *(Premium)*
- **Tickets** — Support ticket system with panels, categories, and close messages
- **Suggestions** — Community suggestions with upvote/downvote reactions
- **Starboard** — Highlight popular messages *(Premium)*
- **Reaction Roles** — Assign roles via message reactions
- **Logs** — Moderation action logging
- **Web Dashboard** — Full configuration UI with Discord OAuth2
- **Internationalization** — Dashboard and bot available in English and Spanish

## Requirements

- Node.js 18+
- MongoDB
- Discord application with bot token

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rubenfp04/kerybot-discord-premiumdashboard.git
   cd kerybot-discord-premiumdashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `config/config.example.js` and configure it.

4. Create a `.env` file:
   ```env
   BOT_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   MONGO_URI=mongodb://localhost:27017/kerybot
   DASHBOARD_PORT=3000
   CALLBACK_URL=http://localhost:3000/auth/callback
   SESSION_SECRET=your_session_secret
   OWNER_ID=your_discord_id
   STRIPE_SECRET_KEY=sk_test_XXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXX
   ```

5. Register slash commands:
   ```bash
   node src/bot/deploy-commands.js
   ```

6. Start the bot:
   ```bash
   node index.js
   ```

## Project Structure

```
index.js              # Entry point
config/               # Configuration files
src/
  bot/
    commands/         # Slash commands (moderation, fun, utility, config)
    events/           # Discord event handlers
    handlers/         # Command and event loaders
    utils/            # Embeds, logger, welcome cards, rank cards, i18n
    locales/          # Bot translations (en.json, es.json)
  dashboard/
    server.js         # Express server setup
    routes/           # Auth, dashboard, API, Stripe routes
    views/            # EJS templates
    public/           # Static assets (CSS)
    locales/          # Dashboard translations (en.json, es.json)
    i18n.js           # Internationalization middleware
  database/
    db.js             # MongoDB connection
    models/           # Mongoose schemas (guild settings, warnings, levels)
```

## Premium

Premium features (Levels, Starboard) are gated behind Stripe payments. The bot auto-creates Stripe products and prices on startup — no manual configuration needed beyond the API keys.

Plans: Lifetime (€19.99), Yearly (€9.99/yr), Monthly (€1.99/mo).

## Language Configuration

- **Dashboard**: Users can switch between English and Spanish using the language switcher in the navbar. Preference is saved in a cookie.
- **Bot**: Each guild can set its language via the dashboard settings. Bot responses will use the configured language.

## License

[MIT](LICENSE)

---

Made with ❤️ by rfernandez
