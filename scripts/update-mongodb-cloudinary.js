#!/usr/bin/env node

/**
 * Script de mise à jour MongoDB avec les URLs Cloudinary
 * Usage: node scripts/update-mongodb-cloudinary.js
 * 
 * Ce script lit le fichier cloudinary-migration-results.json
 * et met à jour les documents MongoDB avec les nouvelles URLs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';

class MongoCloudinaryUpdater {
  constructor() {
    this.updatedCount = 0;
    this.errorCount = 0;
    this.results = [];
  }

  // Connexion à MongoDB via Mongoose
  async connect() {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 60000, // 60 secondes
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000
      });
      console.log('✅ Connexion MongoDB établie via Mongoose');
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB:', error.message);
      throw error;
    }
  }

  // Fermeture de la connexion
  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('🔌 Connexion MongoDB fermée');
    } catch (error) {
      console.error('⚠️ Erreur fermeture connexion:', error.message);
    }
  }

  // Charger les résultats de migration
  async loadMigrationResults() {
    try {
      const resultsPath = path.join(process.cwd(), 'cloudinary-migration-results.json');
      const data = await fs.readFile(resultsPath, 'utf8');
      const migrationData = JSON.parse(data);
      
      console.log(`📄 Résultats de migration chargés: ${migrationData.results.length} fichiers`);
      return migrationData.results;
    } catch (error) {
      console.error('❌ Erreur lecture résultats migration:', error.message);
      console.log('💡 Assurez-vous d\'avoir lancé le script de migration d\'abord');
      throw error;
    }
  }

  // Extraire les informations d'entité depuis le chemin local
  parseEntityFromPath(localPath) {
    const pathParts = localPath.split('/');
    
    // Exemple: /home/.../public/school/students/Palenfo-Étienne-1136073600000/photo.webp
    if (pathParts.includes('students')) {
      const studentFolder = pathParts[pathParts.indexOf('students') + 1];
      const parts = studentFolder.split('-');
      
      if (parts.length >= 3) {
        const nom = parts[0];
        const prenoms = parts.slice(1, -1).join('-'); // Tout sauf le timestamp
        const timestamp = parts[parts.length - 1];
        
        return {
          type: 'eleve',
          nom,
          prenoms,
          timestamp: parseInt(timestamp),
          collection: 'eleves'
        };
      }
    }
    
    if (pathParts.includes('teachers')) {
      const teacherFolder = pathParts[pathParts.indexOf('teachers') + 1];
      const parts = teacherFolder.split('-');
      
      if (parts.length >= 2) {
        const nom = parts[0];
        const prenoms = parts.slice(1).join('-');
        
        return {
          type: 'enseignant',
          nom,
          prenoms,
          collection: 'enseignants'
        };
      }
    }
    
    if (pathParts.includes('classes')) {
      const classFolder = pathParts[pathParts.indexOf('classes') + 1];
      const annee = pathParts[pathParts.indexOf('classes') + 2];
      const parts = classFolder.split('-');
      
      if (parts.length >= 2) {
        const niveau = parts[0];
        const alias = parts[1];
        
        return {
          type: 'classe',
          niveau,
          alias,
          annee,
          collection: 'classes'
        };
      }
    }
    
    return null;
  }

  // Générer l'objet Cloudinary complet
  generateCloudinaryObject(baseUrl, publicId) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    
    return {
      url: baseUrl,
      publicId: publicId,
      thumbnail: `https://res.cloudinary.com/${cloudName}/image/upload/c_thumb,w_150,h_150,f_auto,q_auto/${publicId}`,
      medium: `https://res.cloudinary.com/${cloudName}/image/upload/c_scale,w_400,f_auto,q_auto/${publicId}`,
      large: `https://res.cloudinary.com/${cloudName}/image/upload/c_scale,w_800,f_auto,q_auto/${publicId}`,
      migratedAt: new Date()
    };
  }

  // Mettre à jour un élève
  async updateEleve(entityInfo, cloudinaryData) {
    try {
      console.log(`\n🔍 DEBUG - Recherche élève:`);
      console.log(`   Nom: "${entityInfo.nom}"`);
      console.log(`   Prénoms: "${entityInfo.prenoms}"`);
      console.log(`   Timestamp: ${entityInfo.timestamp}`);
      
      // Stratégie de recherche multiple pour maximiser les chances de correspondance
      const queries = [];
      
      // Query 1: Recherche exacte avec prénoms comme string dans array
      queries.push({
        nom: entityInfo.nom,
        prenoms: entityInfo.prenoms // Recherche directe si c'est un string
      });
      
      // Query 2: Recherche avec prénoms contenant la valeur
      queries.push({
        nom: entityInfo.nom,
        prenoms: { $in: [entityInfo.prenoms] } // Si c'est un array
      });
      
      // Query 3: Recherche avec regex pour gérer les variations
      queries.push({
        nom: entityInfo.nom,
        prenoms: { $regex: entityInfo.prenoms, $options: 'i' }
      });
      
      // Query 4: Si on a le timestamp, ajouter la date comme critère
      if (entityInfo.timestamp) {
        const dateFromTimestamp = new Date(entityInfo.timestamp).toISOString().split('T')[0];
        console.log(`   Date calculée: "${dateFromTimestamp}"`);
        
        queries.push({
          nom: entityInfo.nom,
          prenoms: { $in: [entityInfo.prenoms] },
          naissance_$_date: dateFromTimestamp
        });
      }
      
      console.log(`   Tentative avec ${queries.length} stratégies de recherche...`);
      
      let result = null;
      let queryUsed = null;
      
      // Essayer chaque query jusqu'à trouver une correspondance
      for (let i = 0; i < queries.length; i++) {
        console.log(`   Query ${i + 1}:`, JSON.stringify(queries[i], null, 2));
        
        result = await mongoose.connection.db.collection('ai_eleves_ecole_st_martins').updateOne(
          queries[i],
          { $set: { cloudinary: this.generateCloudinaryObject(cloudinaryData.cloudinaryUrl, cloudinaryData.publicId) } }
        );
        
        console.log(`   Résultat query ${i + 1}: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);
        
        if (result.modifiedCount > 0) {
          queryUsed = i + 1;
          break;
        }
      }
      
      if (result && result.modifiedCount > 0) {
        console.log(`✅ Élève mis à jour avec query ${queryUsed}: ${entityInfo.nom} ${entityInfo.prenoms}`);
        this.updatedCount++;
        return true;
      } else {
        // Si aucune query n'a fonctionné, afficher les élèves avec le même nom pour debug
        console.log(`⚠️ Aucune correspondance trouvée. Recherche d'élèves avec nom "${entityInfo.nom}"...`);
        
        const elevesAvecMemeNom = await mongoose.connection.db.collection('ai_eleves_ecole_st_martins').find({ nom: entityInfo.nom }).toArray();
        console.log(`   Élèves trouvés avec nom "${entityInfo.nom}": ${elevesAvecMemeNom.length}`);
        
        if (elevesAvecMemeNom.length > 0) {
          elevesAvecMemeNom.forEach((eleve, index) => {
            console.log(`   Élève ${index + 1}:`, {
              nom: eleve.nom,
              prenoms: eleve.prenoms,
              naissance_$_date: eleve.naissance_$_date,
              photo_$_file: eleve.photo_$_file
            });
          });
        }
        
        console.log(`❌ Élève non trouvé: ${entityInfo.nom} ${entityInfo.prenoms}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour élève ${entityInfo.nom}:`, error.message);
      this.errorCount++;
      return false;
    }
  }

  // Mettre à jour un enseignant
  async updateEnseignant(entityInfo, cloudinaryData) {
    try {
      const query = {
        nom: entityInfo.nom,
        prenoms: { $in: [entityInfo.prenoms] }
      };
      
      // Générer l'objet Cloudinary complet
      const cloudinaryObject = this.generateCloudinaryObject(cloudinaryData.cloudinaryUrl, cloudinaryData.publicId);
      
      // Mettre à jour avec l'objet Cloudinary
      const updateData = {
        cloudinary: cloudinaryObject
      };
      
      const result = await mongoose.connection.db.collection('ai_profs_ecole_st_martins').updateOne(
        query,
        { $set: updateData }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Enseignant mis à jour: ${entityInfo.nom} ${entityInfo.prenoms}`);
        this.updatedCount++;
        return true;
      } else {
        console.log(`⚠️ Enseignant non trouvé: ${entityInfo.nom} ${entityInfo.prenoms}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour enseignant ${entityInfo.nom}:`, error.message);
      this.errorCount++;
      return false;
    }
  }

  // Mettre à jour une classe
  async updateClasse(entityInfo, cloudinaryData) {
    try {
      console.log(`\n🔍 DEBUG - Recherche classe:`);
      console.log(`   Niveau: "${entityInfo.niveau}"`);
      console.log(`   Alias: "${entityInfo.alias}"`);
      console.log(`   Année: "${entityInfo.annee}"`);
      
      // Stratégies de recherche multiples pour les classes
      const queries = [];
      
      // Query 1: Recherche exacte
      queries.push({
        niveau: entityInfo.niveau,
        alias: entityInfo.alias,
        annee: entityInfo.annee
      });
      
      // Query 2: Recherche avec niveau en majuscules
      queries.push({
        niveau: entityInfo.niveau.toUpperCase(),
        alias: entityInfo.alias,
        annee: entityInfo.annee
      });
      
      // Query 3: Recherche avec regex insensible à la casse
      queries.push({
        niveau: { $regex: entityInfo.niveau, $options: 'i' },
        alias: entityInfo.alias,
        annee: entityInfo.annee
      });
      
      console.log(`   Tentative avec ${queries.length} stratégies de recherche...`);
      
      let result = null;
      let queryUsed = null;
      
      // Essayer chaque query
      for (let i = 0; i < queries.length; i++) {
        console.log(`   Query ${i + 1}:`, JSON.stringify(queries[i], null, 2));
        
        result = await mongoose.connection.db.collection('ai_ecole_st_martins').updateOne(
          queries[i],
          { $set: { cloudinary: this.generateCloudinaryObject(cloudinaryData.cloudinaryUrl, cloudinaryData.publicId) } }
        );
        
        console.log(`   Résultat query ${i + 1}: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);
        
        if (result.modifiedCount > 0) {
          queryUsed = i + 1;
          break;
        }
      }
      
      if (result && result.modifiedCount > 0) {
        console.log(`✅ Classe mise à jour avec query ${queryUsed}: ${entityInfo.niveau} ${entityInfo.alias} ${entityInfo.annee}`);
        this.updatedCount++;
        return true;
      } else {
        // Debug : chercher des classes similaires
        console.log(`⚠️ Aucune correspondance trouvée. Recherche de classes avec niveau "${entityInfo.niveau}"...`);
        
        const classesSimilaires = await mongoose.connection.db.collection('ai_ecole_st_martins').find({
          niveau: { $regex: entityInfo.niveau, $options: 'i' }
        }).toArray();
        
        console.log(`   Classes trouvées avec niveau similaire: ${classesSimilaires.length}`);
        
        if (classesSimilaires.length > 0) {
          classesSimilaires.forEach((classe, index) => {
            console.log(`   Classe ${index + 1}:`, {
              niveau: classe.niveau,
              alias: classe.alias,
              annee: classe.annee,
              photo: classe.photo
            });
          });
        }
        
        console.log(`❌ Classe non trouvée: ${entityInfo.niveau} ${entityInfo.alias} ${entityInfo.annee}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour classe ${entityInfo.niveau}:`, error.message);
      this.errorCount++;
      return false;
    }
  }

  // Traiter tous les résultats de migration
  async updateAllEntities() {
    console.log('🚀 Début de la mise à jour MongoDB...\n');
    
    const migrationResults = await this.loadMigrationResults();
    
    for (const result of migrationResults) {
      const entityInfo = this.parseEntityFromPath(result.localPath);
      
      if (!entityInfo) {
        console.log(`⚠️ Impossible de parser: ${result.localPath}`);
        continue;
      }
      
      const cloudinaryData = {
        cloudinaryUrl: result.cloudinaryUrl,
        publicId: result.publicId
      };
      
      // Mettre à jour selon le type d'entité
      switch (entityInfo.type) {
        case 'eleve':
          await this.updateEleve(entityInfo, cloudinaryData);
          break;
        case 'enseignant':
          await this.updateEnseignant(entityInfo, cloudinaryData);
          break;
        case 'classe':
          await this.updateClasse(entityInfo, cloudinaryData);
          break;
        default:
          console.log(`⚠️ Type d'entité non reconnu: ${entityInfo.type}`);
      }
    }
    
    console.log('\n📊 Résultats de la mise à jour MongoDB:');
    console.log(`✅ Documents mis à jour: ${this.updatedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
  }
}

// Fonction principale
async function main() {
  const updater = new MongoCloudinaryUpdater();
  
  console.log('════════════════════════════════════════════════');
  console.log('   MISE À JOUR MONGODB AVEC CLOUDINARY');
  console.log('════════════════════════════════════════════════\n');
  
  try {
    await updater.connect();
    await updater.updateAllEntities();
    
    console.log('\n════════════════════════════════════════════════');
    console.log('✅ MISE À JOUR MONGODB TERMINÉE !');
    console.log('════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    await updater.disconnect();
  }
}

// Lancer le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
