const mongoose = require('mongoose');

async function connectDatabase() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('[DB] Falta MONGO_URI en el archivo .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('[DB] Conectado a MongoDB');
    } catch (err) {
        console.error('[DB] Error conectando a MongoDB:', err.message);
        process.exit(1);
    }
}

module.exports = { connectDatabase };
