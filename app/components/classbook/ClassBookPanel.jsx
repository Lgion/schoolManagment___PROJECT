'use client';

import React, { useState, useEffect } from 'react';
import { generateClassBookPdf } from './classbookPdf';

export default function ClassBookPanel({ classId, classe, eleves = [] }) {
  const [classBook, setClassBook] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // États d'édition du livre
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Filtres galerie
  const [filter, setFilter] = useState('ALL'); // ALL, INCLUDED, EXCLUDED, FEED, DIRECT

  // Modale de Tagging
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoTags, setPhotoTags] = useState([]);

  // État de génération de masse
  const [generationProgress, setGenerationProgress] = useState(null); // { current, total, studentName }

  // Charger les données initiales
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Charger le ClassBook
      const cbRes = await fetch(`/api/classes/${classId}/classbook`);
      const cbData = await cbRes.json();
      if (!cbRes.ok) throw new Error(cbData.error || 'Erreur lors du chargement du livre de classe');
      setClassBook(cbData.data);
      setTitle(cbData.data.title);
      setCoverImage(cbData.data.coverImage);

      // 2. Charger/Synchroniser les photos
      const phRes = await fetch(`/api/classes/${classId}/classbook/photos`);
      const phData = await phRes.json();
      if (!phRes.ok) throw new Error(phData.error || 'Erreur lors du chargement des photos');
      setPhotos(phData.data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  // Sauvegarder les métadonnées (Titre/Couverture)
  const handleSaveMetadata = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/classes/${classId}/classbook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, coverImage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de sauvegarder');
      setClassBook(data.data);
      setIsEditingMetadata(false);
      setSuccessMsg('Métadonnées mises à jour avec succès !');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Uploader une photo de couverture
  const handleUploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'cover');

    try {
      const res = await fetch(`/api/classes/${classId}/classbook/photos`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverImage(data.data.url);
      setSuccessMsg('Image de couverture téléversée ! N\'oubliez pas d\'enregistrer.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Uploader une photo directe pour la galerie
  const handleUploadPhoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', file.name.split('.')[0] || 'Photo');

        const res = await fetch(`/api/classes/${classId}/classbook/photos`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'upload');
        setPhotos(prev => [data.data, ...prev]);
      }
      setSuccessMsg(`${files.length} photo(s) ajoutée(s) avec succès !`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Basculer l'inclusion d'une photo dans le livre global
  const handleToggleInclude = async (photo, e) => {
    e.stopPropagation();
    setError('');
    const newInClassBook = !photo.inClassBook;
    try {
      const res = await fetch(`/api/classes/${classId}/classbook/photos/${photo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inClassBook: newInClassBook })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(prev => prev.map(p => p._id === photo._id ? data.data : p));
    } catch (err) {
      setError(err.message);
    }
  };

  // Supprimer une photo directe
  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment retirer cette photo définitivement ?')) return;

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/classes/${classId}/classbook/photos/${photoId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      setSuccessMsg('Photo retirée avec succès.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Ouvrir la modale d'édition/tagging
  const handleOpenTagging = (photo) => {
    setEditingPhoto(photo);
    setPhotoCaption(photo.caption || '');
    setPhotoTags(photo.tags.map(t => typeof t === 'string' ? t : t._id));
  };

  // Gérer le toggle de tag élève
  const handleToggleTag = (studentId) => {
    setPhotoTags(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Sauvegarder les tags et la légende
  const handleSavePhotoDetails = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/classes/${classId}/classbook/photos/${editingPhoto._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: photoCaption, tags: photoTags })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPhotos(prev => prev.map(p => p._id === editingPhoto._id ? data.data : p));
      setEditingPhoto(null);
      setSuccessMsg('Détails de la photo enregistrés.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- COMPILATION & UPLOAD PDF ---
  
  // Générer & Télécharger localement
  const handleDownloadLocalPdf = async () => {
    if (photos.filter(p => p.inClassBook).length === 0) {
      alert('Veuillez sélectionner au moins une photo à inclure dans le livre avant de le générer.');
      return;
    }
    setError('');
    setSuccessMsg('Génération du PDF de démonstration...');
    try {
      const doc = await generateClassBookPdf({
        classBook,
        classe,
        students: eleves,
        photos
      });
      doc.save(`${classBook.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      setSuccessMsg('PDF téléchargé avec succès !');
    } catch (err) {
      setError('Erreur lors du téléchargement : ' + err.message);
    }
  };

  // Publier l'album global (Upload vers Cloudinary + mise à jour du livre en BDD)
  const handlePublishGlobalBook = async () => {
    const includedPhotos = photos.filter(p => p.inClassBook);
    if (includedPhotos.length === 0) {
      alert('Veuillez inclure au moins une photo dans le livre avant de le publier.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('Génération et téléversement du PDF global de la classe...');
    try {
      const doc = await generateClassBookPdf({
        classBook,
        classe,
        students: eleves,
        photos
      });

      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, 'classbook_global.pdf');
      formData.append('type', 'global');

      const uploadRes = await fetch(`/api/classes/${classId}/classbook/upload-pdf`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Erreur d\'upload du PDF');

      // Mettre à jour le livre en PUBLISHED
      const updateRes = await fetch(`/api/classes/${classId}/classbook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PUBLISHED',
          globalPdfUrl: uploadData.pdfUrl
        })
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || 'Erreur d\'activation');

      setClassBook(updateData.data);
      setSuccessMsg('Félicitations ! Le livre de classe global a été compilé et publié pour les parents !');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Générer les livres élèves personnalisés en boucle séquentielle
  const handlePublishStudentBooks = async () => {
    if (eleves.length === 0) {
      alert('Aucun élève dans cette classe.');
      return;
    }
    const includedPhotos = photos.filter(p => p.inClassBook);
    if (includedPhotos.length === 0) {
      alert('Veuillez inclure au moins une photo pour lancer la génération.');
      return;
    }

    if (!confirm(`La génération personnalisée va compiler un album unique pour chacun des ${eleves.length} élèves et les rendre disponibles sur leurs profils. Souhaitez-vous continuer ?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    
    try {
      for (let i = 0; i < eleves.length; i++) {
        const student = eleves[i];
        const studentName = `${student.nom} ${Array.isArray(student.prenoms) ? student.prenoms.join(' ') : student.prenoms}`;
        
        setGenerationProgress({
          current: i + 1,
          total: eleves.length,
          studentName
        });

        // 1. Compiler
        const doc = await generateClassBookPdf({
          classBook,
          classe,
          students: eleves,
          photos,
          targetStudentId: student._id
        });

        const pdfBlob = doc.output('blob');
        const formData = new FormData();
        formData.append('file', pdfBlob, `yearbook_${student._id}.pdf`);
        formData.append('type', 'student');
        formData.append('studentId', student._id);

        // 2. Uploader
        const uploadRes = await fetch(`/api/classes/${classId}/classbook/upload-pdf`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(`Erreur lors de l'upload du livre de ${studentName} : ${uploadData.error}`);

        // 3. Enregistrer
        const saveRes = await fetch(`/api/classes/${classId}/classbook/student-books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student._id,
            personalizedPdfUrl: uploadData.pdfUrl
          })
        });
        if (!saveRes.ok) {
          const saveData = await saveRes.json();
          throw new Error(`Erreur d'enregistrement pour ${studentName} : ${saveData.error}`);
        }
      }

      setSuccessMsg(`Félicitations ! Les ${eleves.length} yearbooks personnalisés ont tous été générés et publiés !`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setGenerationProgress(null);
    }
  };

  // Filtrer les photos
  const filteredPhotos = photos.filter(p => {
    if (filter === 'INCLUDED') return p.inClassBook;
    if (filter === 'EXCLUDED') return !p.inClassBook;
    if (filter === 'FEED') return p.source === 'FEED_POST';
    if (filter === 'DIRECT') return p.source === 'UPLOAD_DIRECT';
    return true;
  });

  if (loading) return <div className="cb-loading">Chargement du livre de classe...</div>;

  return (
    <div className="classbook-panel">
      {/* Messages */}
      {error && <div className="cb-alert cb-alert-danger">{error}</div>}
      {successMsg && <div className="cb-alert cb-alert-success">{successMsg}</div>}

      {/* Barre de progression de génération de masse */}
      {generationProgress && (
        <div className="cb-progress-bar">
          <div className="cb-progress-bar-title">
            Génération des Yearbooks personnalisés ({generationProgress.current} / {generationProgress.total})
          </div>
          <div className="cb-progress-bar-subtitle">
            Compilation de l'album de : <strong>{generationProgress.studentName}</strong>
          </div>
          <div className="cb-progress-outer">
            <div 
              className="cb-progress-inner" 
              style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* En-tête de Configuration du Livre */}
      <section className="cb-section cb-meta-section">
        <div className="cb-meta-header">
          <div>
            <h2 className="cb-meta-title">{classBook?.title}</h2>
            <p className="cb-meta-year">Année scolaire : {classBook?.schoolYear}</p>
          </div>
          <div className="cb-meta-actions">
            <span className={`cb-status-badge cb-status-${classBook?.status.toLowerCase()}`}>
              {classBook?.status === 'PUBLISHED' ? '📢 Publié (Parents)' : '✏️ Brouillon'}
            </span>
            <button 
              type="button" 
              className="cb-btn cb-btn-secondary"
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
            >
              {isEditingMetadata ? 'Fermer' : '✏️ Paramètres'}
            </button>
          </div>
        </div>

        {isEditingMetadata && (
          <div className="cb-meta-form">
            <div className="cb-form-group">
              <label>Titre de l'album photo</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Entrez le titre du livre..."
              />
            </div>
            
            <div className="cb-form-group">
              <label>Image de couverture (URL ou fichier)</label>
              <div className="cb-cover-uploader">
                <input 
                  type="text" 
                  value={coverImage} 
                  onChange={(e) => setCoverImage(e.target.value)} 
                  placeholder="URL de l'image de couverture..."
                />
                <span className="cb-or">OU</span>
                <label className="cb-file-btn">
                  📷 Téléverser une photo
                  <input type="file" accept="image/*" onChange={handleUploadCover} style={{ display: 'none' }} />
                </label>
              </div>
              {coverImage && <img src={coverImage} alt="Aperçu couverture" className="cb-cover-preview" />}
            </div>

            <button 
              type="button" 
              className="cb-btn cb-btn-primary" 
              onClick={handleSaveMetadata}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
            </button>
          </div>
        )}
      </section>

      {/* Barre d'actions rapides & Publications */}
      <section className="cb-section cb-actions-section">
        <h3 className="cb-section-title">Compilation & Publication</h3>
        <div className="cb-actions-grid">
          <div className="cb-action-card">
            <h4>1. Aperçu & Test</h4>
            <p>Visualisez la mise en page sous forme de PDF pour valider l'agencement.</p>
            <button type="button" className="cb-btn cb-btn-secondary" onClick={handleDownloadLocalPdf}>
              📥 Télécharger l'aperçu PDF
            </button>
          </div>
          
          <div className="cb-action-card">
            <h4>2. Album Global</h4>
            <p>Compile et publie le livre global de la classe pour tous les élèves et parents.</p>
            <button 
              type="button" 
              className="cb-btn cb-btn-primary" 
              onClick={handlePublishGlobalBook}
              disabled={saving}
            >
              🚀 Publier l'Album Global
            </button>
            {classBook?.globalPdfUrl && (
              <a href={classBook.globalPdfUrl} target="_blank" rel="noopener noreferrer" className="cb-pdf-link">
                📄 Voir le PDF publié
              </a>
            )}
          </div>

          <div className="cb-action-card">
            <h4>3. Albums Individuels (Yearbooks)</h4>
            <p>Génère un album personnalisé unique pour chacun des {eleves.length} élèves.</p>
            <button 
              type="button" 
              className="cb-btn cb-btn-accent" 
              onClick={handlePublishStudentBooks}
              disabled={saving}
            >
              🌟 Générer & Publier les Yearbooks
            </button>
          </div>
        </div>
      </section>

      {/* Curation de la Galerie de Photos */}
      <section className="cb-section cb-gallery-section">
        <div className="cb-gallery-header">
          <h3 className="cb-section-title">Sélection & Curation des photos</h3>
          <label className="cb-upload-btn">
            ➕ Ajouter des photos à l'album
            <input type="file" accept="image/*" multiple onChange={handleUploadPhoto} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Filtres de la galerie */}
        <div className="cb-filters">
          <button 
            type="button" 
            className={`cb-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            Toutes ({photos.length})
          </button>
          <button 
            type="button" 
            className={`cb-filter-btn ${filter === 'INCLUDED' ? 'active' : ''}`}
            onClick={() => setFilter('INCLUDED')}
          >
            Sélectionnées ({photos.filter(p => p.inClassBook).length})
          </button>
          <button 
            type="button" 
            className={`cb-filter-btn ${filter === 'EXCLUDED' ? 'active' : ''}`}
            onClick={() => setFilter('EXCLUDED')}
          >
            Non sélectionnées ({photos.filter(p => !p.inClassBook).length})
          </button>
          <button 
            type="button" 
            className={`cb-filter-btn ${filter === 'FEED' ? 'active' : ''}`}
            onClick={() => setFilter('FEED')}
          >
            Du Mur de classe ({photos.filter(p => p.source === 'FEED_POST').length})
          </button>
          <button 
            type="button" 
            className={`cb-filter-btn ${filter === 'DIRECT' ? 'active' : ''}`}
            onClick={() => setFilter('DIRECT')}
          >
            Uploads directs ({photos.filter(p => p.source === 'UPLOAD_DIRECT').length})
          </button>
        </div>

        {/* Liste des photos */}
        {filteredPhotos.length === 0 ? (
          <div className="cb-empty-gallery">
            <p>Aucune photo ne correspond à ce filtre.</p>
          </div>
        ) : (
          <div className="cb-photo-grid">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo._id} 
                className={`cb-photo-card ${photo.inClassBook ? 'selected' : ''}`}
                onClick={() => handleOpenTagging(photo)}
              >
                <div className="cb-img-wrapper">
                  <img src={photo.url} alt="Classe" />
                  <div className="cb-photo-source-badge">
                    {photo.source === 'FEED_POST' ? '📱 Mur' : '💻 Direct'}
                  </div>
                  {photo.tags?.length > 0 && (
                    <div className="cb-photo-tags-count">
                      🏷️ {photo.tags.length} élève(s)
                    </div>
                  )}
                </div>

                <div className="cb-photo-footer" onClick={(e) => e.stopPropagation()}>
                  <label className="cb-include-checkbox">
                    <input 
                      type="checkbox" 
                      checked={photo.inClassBook} 
                      onChange={(e) => handleToggleInclude(photo, e)}
                    />
                    <span>Sélectionner</span>
                  </label>

                  {photo.source === 'UPLOAD_DIRECT' && (
                    <button 
                      type="button" 
                      className="cb-delete-btn" 
                      onClick={(e) => handleDeletePhoto(photo._id, e)}
                      title="Supprimer la photo"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modale d'identification et légende */}
      {editingPhoto && (
        <div className="cb-modal-overlay">
          <div className="cb-modal-content">
            <div className="cb-modal-header">
              <h3>Identifier les élèves & Éditer les détails</h3>
              <button type="button" className="cb-close-modal" onClick={() => setEditingPhoto(null)}>×</button>
            </div>
            
            <div className="cb-modal-body">
              <div className="cb-modal-img-preview">
                <img src={editingPhoto.url} alt="Aperçu édition" />
              </div>
              
              <div className="cb-modal-fields">
                <div className="cb-form-group">
                  <label>Légende de la photo</label>
                  <input 
                    type="text" 
                    value={photoCaption} 
                    onChange={(e) => setPhotoCaption(e.target.value)} 
                    placeholder="Écrivez une légende descriptive..."
                  />
                </div>

                <div className="cb-form-group">
                  <label>Élèves présents sur cette photo ({photoTags.length})</label>
                  <div className="cb-student-tagger-grid">
                    {eleves.map((student) => {
                      const isTagged = photoTags.includes(student._id);
                      const sName = `${student.nom} ${Array.isArray(student.prenoms) ? student.prenoms[0] : student.prenoms}`;
                      return (
                        <button
                          key={student._id}
                          type="button"
                          className={`cb-student-tag-btn ${isTagged ? 'tagged' : ''}`}
                          onClick={() => handleToggleTag(student._id)}
                        >
                          <img 
                            src={student.photo_$_file || '/school/student.webp'} 
                            alt={sName} 
                            onError={(e) => { e.target.src = '/school/student.webp' }}
                          />
                          <span className="cb-tag-name">{sName}</span>
                          {isTagged && <span className="cb-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="cb-modal-footer">
              <button type="button" className="cb-btn cb-btn-secondary" onClick={() => setEditingPhoto(null)}>
                Annuler
              </button>
              <button type="button" className="cb-btn cb-btn-primary" onClick={handleSavePhotoDetails} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles Premium Scopés */}
      <style jsx>{`
        .classbook-panel {
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #334155;
        }
        .cb-loading {
          padding: 3rem;
          text-align: center;
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }
        .cb-alert {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          font-size: 0.95rem;
        }
        .cb-alert-success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .cb-alert-danger {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .cb-section {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #f1f5f9;
        }
        .cb-section-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e3a8a;
          margin-top: 0;
          margin-bottom: 1.25rem;
        }
        
        /* Progress Bar */
        .cb-progress-bar {
          background: #1e3a8a;
          color: white;
          padding: 1.25rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
        }
        .cb-progress-bar-title {
          font-weight: 700;
          font-size: 1.05rem;
        }
        .cb-progress-bar-subtitle {
          font-size: 0.9rem;
          margin-top: 0.25rem;
          color: #bfdbfe;
        }
        .cb-progress-outer {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          margin-top: 0.75rem;
          overflow: hidden;
        }
        .cb-progress-inner {
          height: 100%;
          background: #eab308;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        /* Metadata configuration */
        .cb-meta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cb-meta-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }
        .cb-meta-year {
          margin: 0.25rem 0 0 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .cb-meta-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .cb-status-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .cb-status-draft {
          background: #f1f5f9;
          color: #475569;
        }
        .cb-status-published {
          background: #e0f2fe;
          color: #0369a1;
        }
        .cb-meta-form {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        .cb-form-group {
          margin-bottom: 1.25rem;
        }
        .cb-form-group label {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: #475569;
          margin-bottom: 0.5rem;
        }
        .cb-form-group input[type="text"] {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s;
        }
        .cb-form-group input[type="text"]:focus {
          border-color: #3b82f6;
        }
        .cb-cover-uploader {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .cb-cover-uploader input {
          flex: 1;
        }
        .cb-or {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .cb-cover-preview {
          margin-top: 0.75rem;
          max-height: 120px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          object-fit: cover;
        }

        /* Compilation Actions */
        .cb-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem;
        }
        .cb-action-card {
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .cb-action-card h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: #0f172a;
          font-size: 1rem;
        }
        .cb-action-card p {
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 0;
          margin-bottom: 1.25rem;
          line-height: 1.4;
          flex: 1;
        }
        .cb-pdf-link {
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: #3b82f6;
          font-weight: 600;
          text-decoration: underline;
        }

        /* Buttons */
        .cb-btn {
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cb-btn-primary {
          background-color: #1e3a8a;
          color: white;
        }
        .cb-btn-primary:hover {
          background-color: #172554;
        }
        .cb-btn-secondary {
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .cb-btn-secondary:hover {
          background-color: #e2e8f0;
        }
        .cb-btn-accent {
          background-color: #eab308;
          color: #1e3a8a;
        }
        .cb-btn-accent:hover {
          background-color: #ca8a04;
        }
        .cb-file-btn {
          padding: 0.6rem 1.2rem;
          background-color: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        .cb-file-btn:hover {
          background-color: #f8fafc;
        }

        /* Gallery and Curation */
        .cb-gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .cb-upload-btn {
          padding: 0.6rem 1.2rem;
          background-color: #10b981;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        .cb-upload-btn:hover {
          background-color: #059669;
        }
        .cb-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .cb-filter-btn {
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          font-size: 0.825rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cb-filter-btn.active {
          background: #1e3a8a;
          color: white;
        }
        .cb-empty-gallery {
          text-align: center;
          padding: 4rem 2rem;
          background: #f8fafc;
          border-radius: 12px;
          color: #64748b;
          border: 2px dashed #cbd5e1;
        }
        
        .cb-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .cb-photo-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .cb-photo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .cb-photo-card.selected {
          border-color: #1e3a8a;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
        }
        .cb-img-wrapper {
          position: relative;
          width: 100%;
          padding-top: 75%; /* 4:3 Aspect Ratio */
          background-color: #f1f5f9;
        }
        .cb-img-wrapper img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cb-photo-source-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.7);
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .cb-photo-tags-count {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(30, 58, 138, 0.85);
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .cb-photo-footer {
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }
        .cb-include-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }
        .cb-include-checkbox input {
          width: 16px;
          height: 16px;
        }
        .cb-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.95rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .cb-delete-btn:hover {
          background-color: #fee2e2;
        }

        /* Tagging Modal */
        .cb-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .cb-modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 750px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .cb-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cb-modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }
        .cb-close-modal {
          background: none;
          border: none;
          font-size: 1.75rem;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .cb-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .cb-modal-body {
            grid-template-columns: 1fr;
          }
        }
        .cb-modal-img-preview {
          border-radius: 12px;
          overflow: hidden;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }
        .cb-modal-img-preview img {
          width: 100%;
          height: auto;
          max-height: 350px;
          object-fit: contain;
          display: block;
        }
        .cb-modal-fields {
          display: flex;
          flex-direction: column;
        }
        .cb-student-tagger-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          max-height: 220px;
          overflow-y: auto;
          padding: 0.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }
        .cb-student-tag-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .cb-student-tag-btn:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .cb-student-tag-btn.tagged {
          border-color: #1e3a8a;
          background: #eff6ff;
        }
        .cb-student-tag-btn img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 0.25rem;
        }
        .cb-tag-name {
          font-size: 0.725rem;
          font-weight: 600;
          color: #334155;
          text-align: center;
        }
        .cb-check {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #1e3a8a;
          color: white;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          font-size: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .cb-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}
