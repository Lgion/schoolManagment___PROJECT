'use client';
import { useState } from 'react';

const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  // Upload unique ou multiple vers Cloudinary
  const uploadToCloudinary = async (files, entityType, entityData, options = {}) => {
    setUploading(true);
    setErrors([]);
    setUploadProgress(0);
    
    try {
      // Préparer FormData
      const formData = new FormData();
      
      // Gérer single file ou array
      const fileArray = Array.isArray(files) ? files : [files];
      fileArray.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('entityType', entityType);
      formData.append('entityData', JSON.stringify(entityData || {}));
      
      // Tags supplémentaires si fournis
      if (options.tags) {
        formData.append('tags', JSON.stringify(options.tags));
      }

      // Upload vers notre API qui utilise Cloudinary
      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, ...result.files]);
        setUploadProgress(100);
        
        // Retourner les URLs pour utilisation immédiate
        return {
          success: true,
          files: result.files,
          urls: result.files.map(f => f.url)
        };
      } else {
        setErrors(result.errors || [{ error: result.error }]);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setErrors([{ error: error.message }]);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setUploading(false);
    }
  };

  // Supprimer un fichier de Cloudinary
  const deleteFromCloudinary = async (publicId) => {
    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicId })
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(prev => prev.filter(f => f.publicId !== publicId));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      return { success: false, error: error.message };
    }
  };

  // Réinitialiser l'état
  const reset = () => {
    setUploadedFiles([]);
    setErrors([]);
    setUploadProgress(0);
  };

  return {
    uploading,
    uploadProgress,
    uploadedFiles,
    errors,
    uploadToCloudinary,
    deleteFromCloudinary,
    reset
  };
};

export default useCloudinaryUpload;
