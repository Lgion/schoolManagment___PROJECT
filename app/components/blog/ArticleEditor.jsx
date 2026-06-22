"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchArticle, createArticle, updateArticle, uploadCover } from './blogApi';
import { renderMarkdownToHtml } from './markdown';
import { useUserRole } from '../../../stores/useUserRole';

/**
 * Éditeur d'article (création si id === 'new', sinon édition/modération).
 */
export default function ArticleEditor({ id }) {
  const router = useRouter();
  const { userRole, clerkUser } = useUserRole();
  const isNew = id === 'new';
  const isStaff = userRole === 'admin' || userRole === 'prof';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [authorId, setAuthorId] = useState(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await fetchArticle(id);
        if (cancelled) return;
        setTitle(a.title || '');
        setContent(a.content || '');
        setCoverImage(a.coverImage || '');
        setTagsInput((a.tags || []).join(', '));
        setStatus(a.status);
        setAuthorId(a.authorId);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isNew]);

  const isAuthor = isNew || (clerkUser?.id && authorId === clerkUser.id) || !clerkUser; // démo : permissif, le serveur tranche

  const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

  const handleCover = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadCover(file);
      setCoverImage(url);
    } catch (err) {
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async (action, extra = {}) => {
    if (!title.trim()) { setError('Le titre est requis.'); return; }
    setBusy(true);
    setError('');
    try {
      const payload = { title, content, coverImage, tags, action, ...extra };
      const saved = isNew ? await createArticle(payload) : await updateArticle(id, payload);
      router.push(saved.status === 'PUBLISHED' ? `/blog/${saved._id}` : '/blog');
    } catch (err) {
      setError(err.message || 'Erreur');
      setBusy(false);
    }
  };

  const reject = async () => {
    const comment = typeof window !== 'undefined' ? window.prompt('Motif du refus (optionnel) :', '') : '';
    save('reject', { moderationComment: comment || '' });
  };

  if (loading) return <p className="blog__hint">Chargement…</p>;

  return (
    <div className="articleEditor">
      <input
        className="articleEditor__title"
        placeholder="Titre de l'article"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="articleEditor__cover">
        {coverImage ? (
          <div className="articleEditor__cover-preview">
            <img src={coverImage} alt="couverture" />
            <button type="button" className="articleEditor__cover-remove" onClick={() => setCoverImage('')}>Retirer</button>
          </div>
        ) : (
          <label className="articleEditor__cover-upload">
            {uploading ? 'Envoi…' : '🖼️ Ajouter une image de couverture'}
            <input type="file" accept="image/*" hidden onChange={(e) => handleCover(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <input
        className="articleEditor__tags"
        placeholder="Tags séparés par des virgules (ex: Sortie scolaire, Science)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
      />

      <div className="articleEditor__toolbar">
        <span className="articleEditor__hint">Mise en forme Markdown : **gras**, *italique*, # Titre, - liste, [lien](url)</span>
        <button type="button" className="articleEditor__toggle" onClick={() => setPreview((p) => !p)}>
          {preview ? '✏️ Éditer' : '👁️ Aperçu'}
        </button>
      </div>

      {preview ? (
        <div
          className="articleEditor__preview articleContent"
          dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
        />
      ) : (
        <textarea
          className="articleEditor__content"
          placeholder="Rédigez votre article…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
        />
      )}

      {error && <p className="blog__error">{error}</p>}

      <div className="articleEditor__actions">
        {(isAuthor || isStaff) && (
          <button type="button" className="articleEditor__btn" disabled={busy} onClick={() => save('draft')}>
            Sauvegarder le brouillon
          </button>
        )}
        {isStaff ? (
          <button type="button" className="articleEditor__btn articleEditor__btn--primary" disabled={busy} onClick={() => save('publish')}>
            {status === 'PENDING_REVIEW' && !isNew ? 'Approuver & publier' : 'Publier'}
          </button>
        ) : (
          <button type="button" className="articleEditor__btn articleEditor__btn--primary" disabled={busy} onClick={() => save('submit')}>
            Soumettre pour relecture
          </button>
        )}
        {isStaff && !isNew && status === 'PENDING_REVIEW' && (
          <button type="button" className="articleEditor__btn articleEditor__btn--reject" disabled={busy} onClick={reject}>
            Rejeter
          </button>
        )}
        <button type="button" className="articleEditor__btn" disabled={busy} onClick={() => router.push('/blog')}>
          Annuler
        </button>
      </div>
    </div>
  );
}
