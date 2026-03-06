import mongoose from 'mongoose';

// URI MongoDB depuis l'env ou fallback local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lpd';
console.log('[MONGODB_URI]', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Utilisation d'un cache global pour réutiliser la connexion
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connexion MongoDB optimisée pour Next.js API routes
 * - Réutilise la connexion si déjà ouverte
 * - Ne jamais fermer la connexion dans une API route
 * - Utilise le pattern singleton
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      bufferCommands: false, // recommandé avec Next.js
      serverSelectionTimeoutMS: 5000, // Timeout après 5s au lieu de 30s
      connectTimeoutMS: 10000, // Timeout de connexion initial
    }).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      if (err.message.includes('ETIMEDOUT') || err.message.includes('ENETUNREACH')) {
        console.error('👉 Tip: Check your internet connection or MongoDB Atlas IP Whitelist.');
      }
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
