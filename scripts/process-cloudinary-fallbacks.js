#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const https = require('https');
const { Datas } = require('../app/api/_/models/Datas');

const BASE_PATH = path.join(process.cwd(), 'public/school');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

// Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceOverwrite = args.includes('--force');
const limitMatch = args.find(arg => arg.startsWith('--limit='));
const limit = limitMatch ? parseInt(limitMatch.split('=')[1]) : null;

console.log('🚀 === TRAITEMENT DES FALLBACKS CLOUDINARY ===');
console.log(`📋 Mode: ${isDryRun ? 'DRY RUN' : 'TRAITEMENT RÉEL'}`);
console.log(`📊 Limite: ${limit || 'Aucune'}`);
console.log(`🔄 Écrasement: ${forceOverwrite ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
console.log('===============================================\n');

function downloadImage(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber) => {
      console.log(`   🌐 Tentative ${attemptNumber}/${retries + 1}: ${url}`);
      
      const request = https.get(url, (response) => {
        console.log(`   📊 Status HTTP: ${response.statusCode}`);
        
        if (response.statusCode !== 200) {
          const error = new Error(`HTTP ${response.statusCode} - ${response.statusMessage}`);
          if (attemptNumber <= retries) {
            console.log(`   🔄 Retry dans 2 secondes...`);
            setTimeout(() => attempt(attemptNumber + 1), 2000);
            return;
          }
          reject(error);
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`   📦 Taille téléchargée: ${buffer.length} bytes`);
          resolve(buffer);
        });
        response.on('error', (err) => {
          console.error(`   🔴 Erreur de réponse: ${err.message}`);
          if (attemptNumber <= retries) {
            console.log(`   🔄 Retry dans 2 secondes...`);
            setTimeout(() => attempt(attemptNumber + 1), 2000);
            return;
          }
          reject(err);
        });
      });

      // Timeout de 10 secondes par tentative
      request.setTimeout(10000, () => {
        request.destroy();
        const error = new Error('Timeout de 10 secondes dépassé');
        if (attemptNumber <= retries) {
          console.log(`   ⏰ Timeout - Retry dans 2 secondes...`);
          setTimeout(() => attempt(attemptNumber + 1), 2000);
          return;
        }
        reject(error);
      });

      request.on('error', (err) => {
        console.error(`   🔴 Erreur de requête: ${err.message}`);
        if (attemptNumber <= retries) {
          console.log(`   🔄 Retry dans 2 secondes...`);
          setTimeout(() => attempt(attemptNumber + 1), 2000);
          return;
        }
        reject(err);
      });
    };

    attempt(1);
  });
}

function getTargetPath(entityType, payload, originalFileName) {
  switch (entityType) {
    case 'eleve': {
      const { nom, prenoms, naissance_$_date } = payload;
      const eleveFolder = `${nom}-${prenoms}-${naissance_$_date}`.replace(/--+/g, '-');
      const destDir = path.join(BASE_PATH, 'students', eleveFolder);
      const isImage = originalFileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const fileName = isImage ? 'photo.webp' : originalFileName;
      return { destDir, fileName, fullPath: path.join(destDir, fileName) };
    }
    case 'enseignant': {
      const { nom, prenoms } = payload;
      const enseignantFolder = `${nom}-${prenoms}`.replace(/--+/g, '-').replace(',', '-');
      const destDir = path.join(BASE_PATH, 'teachers', enseignantFolder);
      return { destDir, fileName: 'photo.webp', fullPath: path.join(destDir, 'photo.webp') };
    }
    case 'classe': {
      const { niveau, alias, annee } = payload;
      const classeFolder = `${niveau?.toLowerCase()}-${alias}/${annee}`;
      const destDir = path.join(BASE_PATH, 'classes', classeFolder);
      return { destDir, fileName: 'photo.webp', fullPath: path.join(destDir, 'photo.webp') };
    }
    default: {
      const destDir = path.join(BASE_PATH, 'misc');
      return { destDir, fileName: originalFileName, fullPath: path.join(destDir, originalFileName) };
    }
  }
}

async function processFallback(fallbackDoc) {
  const { value: data } = fallbackDoc;
  const { cloudinaryUrl, originalFileName, entityType, entityPayload, fileType } = data;
  
  console.log(`📁 Traitement: ${entityType} - ${originalFileName}`);
  
  try {
    const { destDir, fileName, fullPath } = getTargetPath(entityType, entityPayload, originalFileName);
    
    // Vérifier si le fichier existe déjà (sauf si --force est utilisé)
    if (!forceOverwrite) {
      try {
        await fs.access(fullPath);
        console.log(`   ⚠️  Fichier existe déjà, passage au suivant`);
        return { status: 'skipped', reason: 'file_exists' };
      } catch {
        // Le fichier n'existe pas, on peut continuer
      }
    } else {
      // Mode force : vérifier si le fichier existe pour le signaler
      try {
        await fs.access(fullPath);
        console.log(`   🔄 Fichier existant sera écrasé (mode --force)`);
      } catch {
        // Le fichier n'existe pas
      }
    }
    
    if (isDryRun) {
      console.log(`   🔍 [DRY RUN] Téléchargerait et sauvegarderait: ${fullPath}`);
      return { status: 'simulated' };
    }
    
    // Créer le dossier de destination
    await fs.mkdir(destDir, { recursive: true });
    
    // Télécharger l'image
    console.log(`   ⬇️  Téléchargement depuis Cloudinary...`);
    const imageBuffer = await downloadImage(cloudinaryUrl);
    
    // Traiter et sauvegarder l'image
    const isImage = fileType?.startsWith('image/') || originalFileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    if (isImage && fileName.endsWith('.webp')) {
      console.log(`   🖼️  Conversion WebP...`);
      await sharp(imageBuffer).webp().toFile(fullPath);
    } else {
      await fs.writeFile(fullPath, imageBuffer);
    }
    
    console.log(`   ✅ Sauvegardé avec succès: ${fullPath}`);
    
    // Marquer comme traité
    fallbackDoc.value.processed = true;
    fallbackDoc.value.processedAt = new Date();
    fallbackDoc.value.localPath = fullPath.replace(path.join(process.cwd(), 'public'), '');
    await fallbackDoc.save();
    
    return { status: 'success', localPath: fullPath };
    
  } catch (error) {
    console.error(`   ❌ Erreur détaillée:`);
    console.error(`   📄 Fichier: ${originalFileName}`);
    console.error(`   🔗 URL Cloudinary: ${cloudinaryUrl}`);
    console.error(`   💥 Message: ${error.message}`);
    console.error(`   📚 Stack: ${error.stack}`);
    return { status: 'error', error: error.message, details: { originalFileName, cloudinaryUrl } };
  }
}

async function main() {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Récupérer tous les fallbacks non traités
    const query = { 
      key: 'cloudinaryFallback',
      'value.processed': { $ne: true }
    };
    
    const fallbacks = await Datas.find(query)
      .sort({ createdAt: 1 })
      .limit(limit || 1000);
    
    console.log(`📊 ${fallbacks.length} fallbacks à traiter\n`);
    
    if (fallbacks.length === 0) {
      console.log('🎉 Aucun fallback à traiter !');
      return;
    }
    
    const results = { success: 0, skipped: 0, error: 0, simulated: 0 };
    
    for (let i = 0; i < fallbacks.length; i++) {
      const fallback = fallbacks[i];
      console.log(`\n[${i + 1}/${fallbacks.length}]`);
      
      const result = await processFallback(fallback);
      results[result.status]++;
      
      // Petite pause pour éviter de surcharger
      if (!isDryRun && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n🎉 === TRAITEMENT TERMINÉ ===');
    console.log(`✅ Succès: ${results.success}`);
    console.log(`⚠️  Ignorés: ${results.skipped}`);
    console.log(`❌ Erreurs: ${results.error}`);
    if (isDryRun) {
      console.log(`🔍 Simulés: ${results.simulated}`);
    }
    console.log('===============================');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⚠️  Arrêt demandé...');
  await mongoose.disconnect();
  process.exit(0);
});

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processFallback, getTargetPath };
