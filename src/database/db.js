const mongoose = require('mongoose');
const { logger } = require('../bot/utils/logger');

async function connectDatabase() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        logger.error('DB', 'Missing MONGO_URI in .env file');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        logger.success('DB', 'Connected to MongoDB');
    } catch (err) {
        logger.error('DB', `Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
}

module.exports = { connectDatabase };
