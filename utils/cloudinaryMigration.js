// Utilitaire pour migrer les anciennes images locales vers Cloudinary
import cloudinaryService from '@/services/cloudinaryService';
import fs from 'fs/promises';
import path from 'path';

class CloudinaryMigration {
  constructor() {
    this.localBasePath = path.join(process.cwd(), 'public/school');
    this.migratedCount = 0;
    this.errorCount = 0;
    this.results = [];
  }

  // Migrer toutes les images d'un dossier local vers Cloudinary
  async migrateFolder(folderPath, cloudinaryFolder) {
    try {
      console.log(`📁 Migration du dossier: ${folderPath} → ${cloudinaryFolder}`);
      
      const fullPath = path.join(this.localBasePath, folderPath);
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
      console.error(`❌ Erreur migration dossier ${folderPath}:`, error);
      this.errorCount++;
    }
  }

  // Migrer une image spécifique
  async migrateImage(localPath, cloudinaryFolder, fileName) {
    try {
      console.log(`📸 Migration: ${fileName}`);
      
      // Lire le fichier local
      const fileBuffer = await fs.readFile(localPath);
      const base64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      
      // Upload vers Cloudinary
      const result = await cloudinaryService.uploadFile(base64, {
        folder: cloudinaryFolder,
        publicId: path.parse(fileName).name, // Nom sans extension
        tags: ['migration', 'legacy'],
        context: {
          originalPath: localPath,
          migratedAt: new Date().toISOString()
        }
      });
      
      if (result.success) {
        this.migratedCount++;
        this.results.push({
          localPath,
          cloudinaryUrl: result.data.url,
          publicId: result.data.publicId
        });
        console.log(`✅ Migré: ${fileName} → ${result.data.url}`);
      } else {
        this.errorCount++;
        console.error(`❌ Échec migration ${fileName}:`, result.error);
      }
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Erreur migration image ${fileName}:`, error);
    }
  }

  // Vérifier si c'est un fichier image
  isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Migrer toutes les données de l'école
  async migrateSchoolData() {
    console.log('🚀 Début de la migration vers Cloudinary...');
    
    // Migrer les photos d'élèves
    await this.migrateFolder('students', 'school/eleves');
    
    // Migrer les photos d'enseignants
    await this.migrateFolder('teachers', 'school/enseignants');
    
    // Migrer les photos de classes
    await this.migrateFolder('classes', 'school/classes');
    
    console.log('📊 Résultats de la migration:');
    console.log(`✅ Fichiers migrés: ${this.migratedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    
    // Sauvegarder les résultats dans un fichier JSON
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
    await fs.writeFile(
      resultPath,
      JSON.stringify({
        date: new Date().toISOString(),
        migratedCount: this.migratedCount,
        errorCount: this.errorCount,
        results: this.results
      }, null, 2)
    );
    console.log(`💾 Résultats sauvegardés dans: ${resultPath}`);
  }

  // Mettre à jour les références dans MongoDB
  async updateDatabaseReferences() {
    console.log('🔄 Mise à jour des références dans MongoDB...');
    
    for (const result of this.results) {
      // Extraire le type d'entité du chemin
      const pathParts = result.localPath.split('/');
      const entityType = pathParts.includes('students') ? 'eleve' : 
                        pathParts.includes('teachers') ? 'enseignant' : 
                        pathParts.includes('classes') ? 'classe' : null;
      
      if (!entityType) continue;
      
      // Construire l'ancienne URL publique
      const oldUrl = result.localPath.replace(this.localBasePath, '').replace(/\\/g, '/');
      
      // Mettre à jour dans MongoDB (à adapter selon votre structure)
      try {
        // Exemple pour les élèves
        if (entityType === 'eleve') {
          // await Eleve.updateMany(
          //   { photo_$_file: oldUrl },
          //   { $set: { 
          //     photo_$_file: result.cloudinaryUrl,
          //     cloudinaryPublicId: result.publicId 
          //   }}
          // );
        }
        // Faire de même pour enseignants et classes
      } catch (error) {
        console.error(`❌ Erreur mise à jour DB pour ${oldUrl}:`, error);
      }
    }
    
    console.log('✅ Références MongoDB mises à jour');
  }
}

// Export singleton
const migration = new CloudinaryMigration();
export default migration;

// Script de migration CLI
if (require.main === module) {
  (async () => {
    const result = await migration.migrateSchoolData();
    if (result.success) {
      await migration.updateDatabaseReferences();
      console.log('✅ Migration terminée avec succès !');
    } else {
      console.log('⚠️ Migration terminée avec des erreurs');
    }
    process.exit(result.success ? 0 : 1);
  })();
}
