#!/usr/bin/env node

/**
 * Script de migration des fichiers locaux vers Cloudinary
 * Usage: node scripts/migrate-to-cloudinary.js
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;
const path = require('path');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryMigration {
  constructor() {
    this.localBasePath = path.join(process.cwd(), 'public/school');
    this.migratedCount = 0;
    this.errorCount = 0;
    this.results = [];
  }

  // Vérifier si c'est un fichier image
  isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Migrer une image spécifique
  async migrateImage(localPath, cloudinaryFolder, fileName) {
    try {
      console.log(`📸 Migration: ${fileName}`);
      
      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(localPath, {
        folder: cloudinaryFolder,
        public_id: path.parse(fileName).name,
        resource_type: 'auto',
        tags: ['migration', 'legacy'],
        context: {
          originalPath: localPath,
          migratedAt: new Date().toISOString()
        }
      });
      
      this.migratedCount++;
      this.results.push({
        localPath,
        cloudinaryUrl: result.secure_url,
        publicId: result.public_id
      });
      console.log(`✅ Migré: ${fileName} → ${result.secure_url}`);
      
      return { success: true, url: result.secure_url };
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Échec migration ${fileName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Migrer tous les fichiers d'un dossier
  async migrateFolder(folderPath, cloudinaryFolder) {
    try {
      console.log(`\n📁 Migration du dossier: ${folderPath} → ${cloudinaryFolder}`);
      
      const fullPath = path.join(this.localBasePath, folderPath);
      
      // Vérifier si le dossier existe
      try {
        await fs.access(fullPath);
      } catch {
        console.log(`⚠️ Dossier introuvable: ${fullPath}`);
        return;
      }
      
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isDirectory()) {
          // Récursif pour les sous-dossiers
          await this.migrateFolder(
            path.join(folderPath, file.name),
            `${cloudinaryFolder}/${file.name}`
          );
        } else if (this.isImageFile(file.name)) {
          // Migrer l'image
          await this.migrateImage(
            path.join(fullPath, file.name),
            cloudinaryFolder,
            file.name
          );
        }
      }
    } catch (error) {
      console.error(`❌ Erreur migration dossier ${folderPath}:`, error.message);
      this.errorCount++;
    }
  }

  // Migrer toutes les données de l'école
  async migrateSchoolData() {
    console.log('🚀 Début de la migration vers Cloudinary...');
    console.log(`📍 Dossier source: ${this.localBasePath}`);
    
    // Vérifier la configuration Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error('❌ ERREUR: Variables d\'environnement Cloudinary non configurées !');
      console.log('Ajoutez dans .env.local:');
      console.log('CLOUDINARY_CLOUD_NAME=votre_cloud_name');
      console.log('CLOUDINARY_API_KEY=votre_api_key');
      console.log('CLOUDINARY_API_SECRET=votre_api_secret');
      return { success: false };
    }
    
    console.log(`☁️ Cloud Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);
    
    // Migrer les photos d'élèves
    await this.migrateFolder('students', 'school/eleves');
    
    // Migrer les photos d'enseignants
    await this.migrateFolder('teachers', 'school/enseignants');
    
    // Migrer les photos de classes
    await this.migrateFolder('classes', 'school/classes');
    
    // Afficher les résultats
    console.log('\n📊 Résultats de la migration:');
    console.log(`✅ Fichiers migrés: ${this.migratedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    
    // Sauvegarder les résultats
    await this.saveResults();
    
    return {
      success: this.errorCount === 0,
      migratedCount: this.migratedCount,
      errorCount: this.errorCount,
      results: this.results
    };
  }

  // Sauvegarder les résultats de migration
  async saveResults() {
    const resultPath = path.join(process.cwd(), 'cloudinary-migration-results.json');
    try {
      await fs.writeFile(
        resultPath,
        JSON.stringify({
          date: new Date().toISOString(),
          migratedCount: this.migratedCount,
          errorCount: this.errorCount,
          results: this.results
        }, null, 2)
      );
      console.log(`\n💾 Résultats sauvegardés dans: ${resultPath}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde résultats:', error.message);
    }
  }
}

// Fonction principale
async function main() {
  const migration = new CloudinaryMigration();
  
  console.log('════════════════════════════════════════════════');
  console.log('   MIGRATION DES MÉDIAS VERS CLOUDINARY');
  console.log('════════════════════════════════════════════════\n');
  
  const result = await migration.migrateSchoolData();
  
  console.log('\n════════════════════════════════════════════════');
  if (result.success) {
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
  } else {
    console.log('⚠️ MIGRATION TERMINÉE AVEC DES ERREURS');
    console.log('Consultez cloudinary-migration-results.json pour les détails');
  }
  console.log('════════════════════════════════════════════════\n');
  
  process.exit(result.success ? 0 : 1);
}

// Lancer le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
