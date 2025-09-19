#!/usr/bin/env node

/**
 * Script de debug pour voir les élèves réels dans MongoDB
 * Usage: node scripts/debug-mongodb-eleves.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';

async function debugEleves() {
  try {
    // Connexion
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');
    
    // Test spécifique pour Aby Kousso
    console.log('\n🔍 Test de recherche pour "Aby Kousso":');
    console.log('═'.repeat(50));
    
    // Query 1: Recherche exacte
    const query1 = { nom: "Aby Kousso", prenoms: "Éna Murielle" };
    console.log('Query 1:', JSON.stringify(query1, null, 2));
    const result1 = await mongoose.connection.db.collection('eleves').findOne(query1);
    console.log('Résultat 1:', result1 ? '✅ Trouvé' : '❌ Non trouvé');
    
    // Query 2: Recherche avec $in
    const query2 = { nom: "Aby Kousso", prenoms: { $in: ["Éna Murielle"] } };
    console.log('\nQuery 2:', JSON.stringify(query2, null, 2));
    const result2 = await mongoose.connection.db.collection('eleves').findOne(query2);
    console.log('Résultat 2:', result2 ? '✅ Trouvé' : '❌ Non trouvé');
    
    // Query 3: Recherche par nom seulement
    const query3 = { nom: "Aby Kousso" };
    console.log('\nQuery 3:', JSON.stringify(query3, null, 2));
    const result3 = await mongoose.connection.db.collection('eleves').findOne(query3);
    console.log('Résultat 3:', result3 ? '✅ Trouvé' : '❌ Non trouvé');
    
    if (result3) {
      console.log('\n📋 Données de l\'élève trouvé:');
      console.log(`   Nom: "${result3.nom}"`);
      console.log(`   Prénoms: ${JSON.stringify(result3.prenoms)}`);
      console.log(`   Type prénoms: ${Array.isArray(result3.prenoms) ? 'Array' : typeof result3.prenoms}`);
      console.log(`   Date naissance: "${result3.naissance_$_date}"`);
      console.log(`   Photo: "${result3.photo_$_file}"`);
    }
    
    // Test de mise à jour
    console.log('\n🔧 Test de mise à jour:');
    const updateResult = await mongoose.connection.db.collection('eleves').updateOne(
      { nom: "Aby Kousso", prenoms: { $in: ["Éna Murielle"] } },
      { $set: { test_cloudinary: "test_value" } }
    );
    console.log(`Résultat update: matchedCount=${updateResult.matchedCount}, modifiedCount=${updateResult.modifiedCount}`);
    
    // Nettoyer le test
    if (updateResult.modifiedCount > 0) {
      await mongoose.connection.db.collection('eleves').updateOne(
        { nom: "Aby Kousso" },
        { $unset: { test_cloudinary: "" } }
      );
      console.log('✅ Test nettoyé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

// Lancer le debug
debugEleves();
