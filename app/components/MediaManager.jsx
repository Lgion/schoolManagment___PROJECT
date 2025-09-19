'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const MediaManager = ({ 
  entityType, 
  entityData, 
  onUploadSuccess, 
  existingFiles = [],
  maxFiles = 10,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf']
  }
}) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Charger les fichiers existants au montage
  useEffect(() => {
    if (entityData?._id) {
      loadExistingFiles();
    }
  }, [entityData?._id]);

  // Charger les fichiers existants depuis Cloudinary
  const loadExistingFiles = async () => {
    try {
      const response = await fetch(`/api/cloudinary/list?entityType=${entityType}&entityId=${entityData._id}`);
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('❌ Erreur chargement fichiers:', error);
    }
  };

  // Upload des fichiers vers Cloudinary
  const uploadFiles = async (filesToUpload) => {
    setUploading(true);
    setErrors([]);
    
    const formData = new FormData();
    filesToUpload.forEach(file => {
      formData.append('files', file);
    });
    formData.append('entityType', entityType);
    formData.append('entityData', JSON.stringify(entityData || {}));
    formData.append('tags', JSON.stringify([entityType, entityData?.niveau, entityData?.annee].filter(Boolean)));

    try {
      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setFiles(prev => [...prev, ...result.files]);
        if (onUploadSuccess) {
          onUploadSuccess(result.files);
        }
        
        // Afficher les erreurs éventuelles
        if (result.errors) {
          setErrors(result.errors);
        }
      } else {
        setErrors([{ error: result.error }]);
      }
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setErrors([{ error: error.message }]);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Supprimer un fichier
  const deleteFile = async (publicId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

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
        setFiles(prev => prev.filter(f => f.publicId !== publicId));
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Supprimer plusieurs fichiers
  const deleteMultipleFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Aucun fichier sélectionné');
      return;
    }

    if (!confirm(`Supprimer ${selectedFiles.length} fichier(s) ?`)) return;

    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicIds: selectedFiles })
      });

      const result = await response.json();
      
      if (result.success) {
        setFiles(prev => prev.filter(f => !selectedFiles.includes(f.publicId)));
        setSelectedFiles([]);
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Configuration de react-dropzone
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message).join(', ')
      }));
      setErrors(errors);
    }

    if (acceptedFiles.length > 0) {
      uploadFiles(acceptedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    multiple: true
  });

  // Toggle sélection fichier
  const toggleFileSelection = (publicId) => {
    setSelectedFiles(prev => {
      if (prev.includes(publicId)) {
        return prev.filter(id => id !== publicId);
      }
      return [...prev, publicId];
    });
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mediaManager">
      <div className="mediaManager__header">
        <h3 className="mediaManager__title">📁 Gestionnaire de Médias</h3>
        <div className="mediaManager__stats">
          <span className="mediaManager__count">
            {files.length}/{maxFiles} fichiers
          </span>
          {selectedFiles.length > 0 && (
            <button 
              className="mediaManager__deleteBtn"
              onClick={deleteMultipleFiles}
            >
              🗑️ Supprimer ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Zone de drop */}
      <div 
        {...getRootProps()} 
        className={`mediaManager__dropzone ${isDragActive ? 'mediaManager__dropzone--active' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="mediaManager__uploading">
            <div className="mediaManager__spinner"></div>
            <p>Upload en cours...</p>
          </div>
        ) : isDragActive ? (
          <p className="mediaManager__dropText">📥 Déposez les fichiers ici</p>
        ) : (
          <div className="mediaManager__dropContent">
            <p className="mediaManager__dropIcon">📤</p>
            <p className="mediaManager__dropText">
              Glissez-déposez des fichiers ici ou cliquez pour parcourir
            </p>
            <p className="mediaManager__dropInfo">
              Formats acceptés: Images (JPEG, PNG, WebP) et PDF
            </p>
          </div>
        )}
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="mediaManager__errors">
          {errors.map((error, index) => (
            <div key={index} className="mediaManager__error">
              ⚠️ {error.file}: {error.error || error.errors}
            </div>
          ))}
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="mediaManager__files">
          <h4 className="mediaManager__filesTitle">Fichiers uploadés</h4>
          <div className="mediaManager__filesList">
            {files.map((file) => (
              <div key={file.publicId} className="mediaManager__file">
                <input
                  type="checkbox"
                  className="mediaManager__checkbox"
                  checked={selectedFiles.includes(file.publicId)}
                  onChange={() => toggleFileSelection(file.publicId)}
                />
                
                {/* Aperçu */}
                {file.resourceType === 'image' ? (
                  <img 
                    src={file.thumbnailUrl || file.url} 
                    alt={file.originalName}
                    className="mediaManager__thumbnail"
                  />
                ) : (
                  <div className="mediaManager__fileIcon">
                    {file.format === 'pdf' ? '📄' : '📎'}
                  </div>
                )}
                
                {/* Infos fichier */}
                <div className="mediaManager__fileInfo">
                  <p className="mediaManager__fileName">
                    {file.originalName || file.publicId.split('/').pop()}
                  </p>
                  <p className="mediaManager__fileMeta">
                    {formatFileSize(file.size)} • {file.format?.toUpperCase()}
                    {file.width && ` • ${file.width}x${file.height}`}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="mediaManager__fileActions">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mediaManager__actionBtn"
                    title="Voir"
                  >
                    👁️
                  </a>
                  <button
                    onClick={() => deleteFile(file.publicId)}
                    className="mediaManager__actionBtn mediaManager__actionBtn--delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
