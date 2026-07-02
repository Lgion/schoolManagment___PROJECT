'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchGallery,
  fetchAlbum,
  deleteAlbum,
  deleteAlbumImage,
  academicYearOptions,
  academicYearOf,
  formatAlbumDate,
} from './galleryApi';

// Empêche la sauvegarde « facile » d'une image (décourage, n'empêche pas tout).
const noContext = (e) => e.preventDefault();

function AlbumCard({ album, onOpen, onDelete }) {
  return (
    <article className={`gallery__card${album.locked ? ' gallery__card--locked' : ''}`}>
      <button type="button" className="gallery__cardBtn" onClick={() => onOpen(album)}>
        <div className="gallery__cover">
          {album.locked ? (
            <div className="gallery__lock"><span className="gallery__lockIcon">🔒</span></div>
          ) : album.cover ? (
            <img src={album.cover} alt="" className="gallery__coverImg" draggable={false} onContextMenu={noContext} />
          ) : (
            <div className="gallery__lock"><span className="gallery__lockIcon">📷</span></div>
          )}
          <span className="gallery__count">{album.imageCount} 📸</span>
        </div>
        <div className="gallery__cardBody">
          <h3 className="gallery__cardTitle">{album.title}</h3>
          <p className="gallery__cardMeta">
            {album.isGlobal ? <span className="gallery__tag gallery__tag--school">École</span>
              : album.className ? <span className="gallery__tag gallery__tag--class">{album.className}</span> : null}
            <span className="gallery__date">{formatAlbumDate(album.date)}</span>
          </p>
          {album.locked && (
            <p className="gallery__lockMsg">
              Réservé aux élèves et parents de la classe {album.className || ''}.
            </p>
          )}
        </div>
      </button>
      {album.canModerate && (
        <button type="button" className="gallery__cardDelete" title="Supprimer l'album" onClick={() => onDelete(album)}>🗑️</button>
      )}
    </article>
  );
}

function Lightbox({ album, onClose, onImageDeleted }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');

  const removeImage = async (img) => {
    if (!confirm('Supprimer définitivement cette photo ?')) return;
    setBusy(img._id);
    setErr('');
    try {
      await deleteAlbumImage(album._id, img._id);
      onImageDeleted(img._id);
    } catch (e) {
      setErr(e.message || 'Erreur');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="gallery__lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gallery__lightboxInner" onClick={(e) => e.stopPropagation()}>
        <header className="gallery__lightboxHead">
          <div>
            <h2 className="gallery__lightboxTitle">{album.title}</h2>
            <p className="gallery__lightboxMeta">
              {album.className && <span className="gallery__tag gallery__tag--class">{album.className}</span>}
              {album.isGlobal && <span className="gallery__tag gallery__tag--school">École</span>}
              <span className="gallery__date">{formatAlbumDate(album.date)}</span>
            </p>
          </div>
          <button type="button" className="gallery__lightboxClose" onClick={onClose} aria-label="Fermer">✕</button>
        </header>

        {err && <p className="gallery__error">{err}</p>}

        {album.images.length === 0 ? (
          <p className="gallery__empty">Aucune photo dans cet album.</p>
        ) : (
          <div className="gallery__masonry">
            {album.images.map((img) => (
              <figure key={img._id} className="gallery__photo">
                <img src={img.url} alt={img.caption || ''} draggable={false} onContextMenu={noContext} loading="lazy" />
                {img.caption && <figcaption className="gallery__caption">{img.caption}</figcaption>}
                {album.canModerate && (
                  <button
                    type="button"
                    className="gallery__photoDelete"
                    disabled={busy === img._id}
                    onClick={() => removeImage(img)}
                    title="Supprimer cette photo"
                  >🗑️</button>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Galerie des souvenirs : sélecteur d'année scolaire + cartes d'albums (tri par
 * date décroissante). Les albums restreints (RGPD) apparaissent verrouillés.
 */
export default function GalleryView() {
  const [year, setYear] = useState(() => academicYearOf());
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAlbum, setOpenAlbum] = useState(null);
  const [openError, setOpenError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchGallery(year);
      setAlbums(data);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = async (album) => {
    setOpenError('');
    if (album.locked) {
      setOpenError(`Cet album est réservé aux élèves et parents de la classe ${album.className || ''}.`);
      return;
    }
    try {
      const full = await fetchAlbum(album._id);
      setOpenAlbum(full);
    } catch (e) {
      setOpenError(e.message || 'Accès refusé');
    }
  };

  const handleDeleteAlbum = async (album) => {
    if (!confirm(`Supprimer définitivement l'album « ${album.title} » et toutes ses photos ?`)) return;
    try {
      await deleteAlbum(album._id);
      setAlbums((prev) => prev.filter((a) => a._id !== album._id));
    } catch (e) {
      setError(e.message || 'Erreur');
    }
  };

  const handleImageDeleted = (imageId) => {
    setOpenAlbum((prev) => prev && { ...prev, images: prev.images.filter((i) => i._id !== imageId) });
    setAlbums((prev) => prev.map((a) => (a._id === openAlbum?._id ? { ...a, imageCount: Math.max(0, a.imageCount - 1) } : a)));
  };

  return (
    <div className="gallery">
      <header className="gallery__header">
        <div>
          <h1 className="gallery__pageTitle">📸 Galerie des souvenirs</h1>
          <p className="gallery__subtitle">Les photos prises lors des visios et événements de l'école.</p>
        </div>
        <label className="gallery__yearPick">
          <span>Année scolaire</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {academicYearOptions(5).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </header>

      {openError && <p className="gallery__error">🔒 {openError}</p>}
      {error && <p className="gallery__error">{error}</p>}

      {loading ? (
        <p className="gallery__loading">Chargement…</p>
      ) : albums.length === 0 ? (
        <p className="gallery__empty">Aucun album pour {year}.</p>
      ) : (
        <div className="gallery__grid">
          {albums.map((album) => (
            <AlbumCard key={album._id} album={album} onOpen={handleOpen} onDelete={handleDeleteAlbum} />
          ))}
        </div>
      )}

      {openAlbum && (
        <Lightbox album={openAlbum} onClose={() => setOpenAlbum(null)} onImageDeleted={handleImageDeleted} />
      )}
    </div>
  );
}
