"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  formatFileSize,
  formatDocDate,
  formatTeacherName,
} from './documentsApi';

/**
 * Section « Documents de cours » d'une classe.
 *
 * - Lecture (élève / parent / tous) : liste cliquable des PDF (ouverture nouvel onglet).
 * - Gestion (prof / admin, via `canManage`) : zone de dépôt glisser-déposer,
 *   champ titre, barre de progression d'upload, et corbeille de suppression.
 *
 * Props :
 *  - classId : identifiant de la classe
 *  - canManage : booléen — affiche les outils de dépôt/suppression
 */
export default function ClassDocuments({ classId, canManage = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // État du formulaire de dépôt
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError('');
    try {
      setDocuments(await fetchDocuments(classId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const isPdf = (f) =>
    f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));

  const pickFile = (f) => {
    if (!f) return;
    if (!isPdf(f)) {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    setError('');
    setFile(f);
    // Pré-remplir le titre avec le nom du fichier (sans extension) s'il est vide
    if (!title.trim()) {
      setTitle((f.name || '').replace(/\.pdf$/i, ''));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier PDF.'); return; }
    if (!title.trim()) { setError('Veuillez saisir un titre.'); return; }

    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const created = await uploadDocument(classId, file, title.trim(), setProgress);
      setDocuments((prev) => [created, ...prev]);
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Supprimer définitivement « ${doc.title} » ?`)) return;
    setDeletingId(doc._id);
    setError('');
    try {
      await deleteDocument(classId, doc._id);
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="classDocs">
      {canManage && (
        <div className="classDocs__upload">
          <div
            className={`classDocs__dropzone ${dragOver ? '--over' : ''} ${file ? '--has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="classDocs__fileInput"
              onChange={(e) => pickFile(e.target.files?.[0])}
              disabled={uploading}
            />
            <span className="classDocs__dropicon">📄</span>
            {file ? (
              <span className="classDocs__dropfile">
                {file.name} <em>({formatFileSize(file.size)})</em>
              </span>
            ) : (
              <span className="classDocs__droptext">
                Glissez-déposez un PDF ici, ou <b>cliquez pour choisir</b>
              </span>
            )}
          </div>

          <div className="classDocs__form">
            <input
              type="text"
              className="classDocs__titleInput"
              placeholder="Titre du document (ex : Chapitre 1 — Les fractions)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
            <button
              type="button"
              className="classDocs__uploadBtn"
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
            >
              {uploading ? `Envoi… ${progress}%` : '⬆️ Partager'}
            </button>
          </div>

          {uploading && (
            <div className="classDocs__progress">
              <div className="classDocs__progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {error && <div className="classDocs__error">{error}</div>}

      {loading ? (
        <div className="classDocs__loading">Chargement des documents…</div>
      ) : documents.length === 0 ? (
        <div className="classDocs__empty">
          {canManage
            ? 'Aucun document partagé pour le moment. Déposez un premier PDF ci-dessus.'
            : 'Aucun document de cours pour le moment.'}
        </div>
      ) : (
        <ul className="classDocs__list">
          {documents.map((doc) => {
            const teacher = formatTeacherName(doc.teacherId);
            return (
              <li key={doc._id} className="classDocs__item">
                <a
                  className="classDocs__link"
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="classDocs__item-icon">📄</span>
                  <span className="classDocs__item-main">
                    <span className="classDocs__item-title">{doc.title}</span>
                    <span className="classDocs__item-meta">
                      {formatDocDate(doc.createdAt)}
                      {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                      {teacher ? ` · ${teacher}` : ''}
                    </span>
                  </span>
                </a>
                {canManage && (
                  <button
                    type="button"
                    className="classDocs__deleteBtn"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc._id}
                    title="Supprimer ce document"
                    aria-label={`Supprimer ${doc.title}`}
                  >
                    {deletingId === doc._id ? '…' : '🗑️'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
