// Service Cloudinary pour gérer tous les uploads et opérations médias
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary (sera initialisée côté serveur)
const initCloudinary = () => {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
  return cloudinary;
};

class CloudinaryService {
  constructor() {
    this.cloudinary = null;
    // Folders structure pour l'école
    this.folders = {
      eleves: 'school/eleves',
      enseignants: 'school/enseignants',
      classes: 'school/classes',
      documents: 'school/documents',
      events: 'school/events'
    };
  }

  // Initialiser le service (côté serveur uniquement)
  init() {
    if (typeof window === 'undefined') {
      this.cloudinary = initCloudinary();
    }
    return this;
  }

  // Générer un publicId unique basé sur les infos de l'entité
  generatePublicId(type, entity) {
    const timestamp = Date.now();
    switch(type) {
      case 'eleve':
        const eleveId = `${entity.nom}-${entity.prenoms}-${entity.naissance_$_date}`.replace(/\s+/g, '-').toLowerCase();
        return `${this.folders.eleves}/${eleveId}/${timestamp}`;
      
      case 'enseignant':
        const enseignantId = `${entity.nom}-${entity.prenoms}`.replace(/\s+/g, '-').toLowerCase();
        return `${this.folders.enseignants}/${enseignantId}/${timestamp}`;
      
      case 'classe':
        const classeId = `${entity.niveau}-${entity.alias}/${entity.annee}`.replace(/\s+/g, '-').toLowerCase();
        return `${this.folders.classes}/${classeId}/${timestamp}`;
      
      default:
        return `${this.folders.documents}/${timestamp}`;
    }
  }

  // Upload un fichier vers Cloudinary
  async uploadFile(file, options = {}) {
    this.init();
    
    try {
      const uploadOptions = {
        resource_type: 'auto', // Détection automatique image/raw/video
        folder: options.folder || this.folders.documents,
        public_id: options.publicId,
        transformation: options.transformation || [],
        tags: options.tags || [],
        context: options.context || {},
        ...options
      };

      // Si c'est une image, ajouter des transformations par défaut
      if (options.isPhoto) {
        uploadOptions.transformation = [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
          { width: 800, height: 800, crop: 'limit' }
        ];
        uploadOptions.eager = [
          { width: 200, height: 200, crop: 'thumb', gravity: 'face' },
          { width: 500, height: 500, crop: 'fill', gravity: 'face' }
        ];
      }

      const result = await this.cloudinary.uploader.upload(file, uploadOptions);
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url,
          mediumUrl: result.eager?.[1]?.secure_url || result.secure_url,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          resourceType: result.resource_type,
          createdAt: result.created_at
        }
      };
    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'upload'
      };
    }
  }

  // Upload multiple files
  async uploadMultiple(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    const results = await Promise.allSettled(uploadPromises);
    
    return {
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      data: results.map(r => r.status === 'fulfilled' ? r.value.data : null).filter(Boolean),
      errors: results.filter(r => r.status === 'rejected' || !r.value?.success)
                     .map(r => r.reason || r.value?.error)
    };
  }

  // Supprimer un fichier de Cloudinary
  async deleteFile(publicId, resourceType = 'image') {
    this.init();
    
    try {
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      
      return {
        success: result.result === 'ok',
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur suppression Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Supprimer plusieurs fichiers
  async deleteMultiple(publicIds) {
    this.init();
    
    try {
      const result = await this.cloudinary.api.delete_resources(publicIds);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur suppression multiple Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mettre à jour un fichier (tags, context, etc.)
  async updateFile(publicId, updates = {}) {
    this.init();
    
    try {
      const result = await this.cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        tags: updates.tags,
        context: updates.context
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur mise à jour Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lister les fichiers d'un dossier
  async listFiles(folder, options = {}) {
    this.init();
    
    try {
      const result = await this.cloudinary.search
        .expression(`folder:${folder}`)
        .sort_by('created_at', 'desc')
        .max_results(options.maxResults || 30)
        .execute();
      
      return {
        success: true,
        data: result.resources.map(resource => ({
          publicId: resource.public_id,
          url: resource.secure_url,
          format: resource.format,
          size: resource.bytes,
          width: resource.width,
          height: resource.height,
          resourceType: resource.resource_type,
          createdAt: resource.created_at,
          tags: resource.tags || []
        })),
        totalCount: result.total_count
      };
    } catch (error) {
      console.error('❌ Erreur listing Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Rechercher des fichiers par tags
  async searchByTags(tags, options = {}) {
    this.init();
    
    try {
      const tagExpression = Array.isArray(tags) ? tags.join(' AND ') : tags;
      const result = await this.cloudinary.search
        .expression(`tags=${tagExpression}`)
        .sort_by('created_at', 'desc')
        .max_results(options.maxResults || 30)
        .execute();
      
      return {
        success: true,
        data: result.resources,
        totalCount: result.total_count
      };
    } catch (error) {
      console.error('❌ Erreur recherche Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Créer un dossier
  async createFolder(folderPath) {
    this.init();
    
    try {
      const result = await this.cloudinary.api.create_folder(folderPath);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur création dossier Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Générer une URL de transformation
  getTransformationUrl(publicId, transformations = {}) {
    const defaultTransformations = {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations
    };
    
    return this.cloudinary.url(publicId, defaultTransformations);
  }

  // Générer une URL sécurisée pour upload direct depuis le client
  async generateUploadSignature(options = {}) {
    this.init();
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder: options.folder || this.folders.documents,
      ...options
    };
    
    const signature = this.cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    
    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      ...params
    };
  }

  // Obtenir les statistiques d'usage
  async getUsageStats() {
    this.init();
    
    try {
      const result = await this.cloudinary.api.usage();
      return {
        success: true,
        data: {
          storage: {
            used: result.storage.usage,
            limit: result.storage.limit,
            percentage: (result.storage.usage / result.storage.limit) * 100
          },
          bandwidth: {
            used: result.bandwidth.usage,
            limit: result.bandwidth.limit,
            percentage: (result.bandwidth.usage / result.bandwidth.limit) * 100
          },
          transformations: result.transformations
        }
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
