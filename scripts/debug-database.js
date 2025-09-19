#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';

async function debugDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');
    console.log(`🔗 URI: ${MONGODB_URI}`);
    console.log(`🗄️ Base de données: ${mongoose.connection.name}`);
    
    // Lister toutes les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Collections disponibles:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Compter les documents dans eleves
    const elevesCount = await mongoose.connection.db.collection('eleves').countDocuments();
    console.log(`\n👥 Nombre d'élèves: ${elevesCount}`);
    
    if (elevesCount > 0) {
      // Récupérer les 3 premiers élèves
      const eleves = await mongoose.connection.db.collection('eleves').find({}).limit(3).toArray();
      
      console.log('\n🎓 Premiers élèves:');
      eleves.forEach((eleve, index) => {
        console.log(`\n${index + 1}. ID: ${eleve._id}`);
        console.log(`   Nom: "${eleve.nom}" (longueur: ${eleve.nom?.length || 0})`);
        console.log(`   Nom (hex): ${Buffer.from(eleve.nom || '', 'utf8').toString('hex')}`);
        console.log(`   Prénoms: ${JSON.stringify(eleve.prenoms)}`);
        console.log(`   Date: ${eleve.naissance_$_date}`);
      });
      
      // Recherche avec regex pour trouver des noms similaires à "Aby"
      console.log('\n🔍 Recherche avec regex "Aby":');
      const abyResults = await mongoose.connection.db.collection('eleves').find({
        nom: { $regex: 'Aby', $options: 'i' }
      }).toArray();
      
      console.log(`Résultats trouvés: ${abyResults.length}`);
      abyResults.forEach(eleve => {
        console.log(`   - "${eleve.nom}" | Prénoms: ${JSON.stringify(eleve.prenoms)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

debugDatabase();
