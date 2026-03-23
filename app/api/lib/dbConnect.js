import mongoose from 'mongoose';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, uri: null };
}

/**
 * Connexion MongoDB optimisée pour Next.js API routes
 * Déclenche MONGODB_sample_URI automatiquement si un user n'est pas loggé.
 */
async function dbConnect() {
  const URI_MAIN = process.env.MONGODB_URI;
  const URI_SAMPLE = process.env.MONGODB_sample_URI;

  let useSample = false;
  try {
    const authObj = await auth();
    let forceFalsy = false;
    
    try {
      const cookieStore = await cookies();
      forceFalsy = cookieStore.get('force_falsy')?.value === 'true';
    } catch (e) {
      // Pas de contexte de cookies
    }

    // Bypass strict de sécurité : Un administrateur enregistré ne DOIT JAMAIS subir le mode Falsy
    // Même si son ordinateur avait gardé le cookie depuis une session "Visiteur".
    if (authObj && authObj.userId) {
      const user = await currentUser();
      const email = user?.primaryEmailAddress?.emailAddress;
      const isAdminEmail = email && process.env.NEXT_PUBLIC_EMAIL_ADMIN && process.env.NEXT_PUBLIC_EMAIL_ADMIN.includes(email);
      
      if (isAdminEmail) {
        forceFalsy = false; // L'Admin écrase le cookie falsy
      } else {
        forceFalsy = true;  // Simple visiteur (non-admin) forcé en falsy
      }
    }

    // Si aucun uuid de userID n'est actif, OU si forcé en Falsy, passer en mode sample
    if (forceFalsy || !authObj || !authObj.userId) {
      useSample = true;
    }
  } catch (error) {
    // Si l'erreur est liée au contexte Server Actions/Pages
  }

  const MONGODB_URI = useSample && URI_SAMPLE ? URI_SAMPLE : (URI_MAIN || 'mongodb://localhost:27017/lpd');

  // Si on est déjà connecté mais que l'URI demandée a changé : on force la déconnexion
  if (cached.conn && cached.uri !== MONGODB_URI) {
    console.log(`[MONGODB_CONN] Changement de mode détecté ! Déconnexion de l'ancienne base...`);
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log(`[MONGODB_CONN] ${useSample ? '🌐 MODE FALSY (Sample DB)' : '🌍 MODE NORMAL (Main DB)'}`);
    cached.uri = MONGODB_URI;
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: true, // Plus sûr pour les requêtes concurrentes dans Next.js
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then((mongooseInstance) => {
      console.log('✅ Connected to MongoDB -> ' + (useSample ? 'Sample' : 'Main'));
      return mongooseInstance;
    }).catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
