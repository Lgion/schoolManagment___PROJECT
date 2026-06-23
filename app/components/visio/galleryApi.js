// Helpers client pour la visio & la galerie de souvenirs.
// L'authentification Clerk passe par les cookies (middleware).

// --- Année scolaire (sept → août), pure & client-safe ---
export function academicYearOf(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0=janv … 8=sept
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// Les `count` dernières années scolaires (la plus récente d'abord), pour le sélecteur.
export function academicYearOptions(count = 4) {
  const start = Number(academicYearOf().split('-')[0]);
  return Array.from({ length: count }, (_, i) => `${start - i}-${start - i + 1}`);
}

// "Lundi 15 octobre 2025" à partir d'une date ISO.
export function formatAlbumDate(iso) {
  try {
    const d = new Date(iso);
    const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch (_) {
    return '';
  }
}

// --- Galerie ---
export async function fetchGallery(year) {
  const qs = year ? `?year=${encodeURIComponent(year)}` : '';
  const res = await fetch(`/api/gallery${qs}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement de la galerie');
  return data; // { data: [...albums], year }
}

export async function fetchAlbum(id) {
  const res = await fetch(`/api/gallery/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Accès refusé');
  return data.data;
}

export async function deleteAlbum(id) {
  const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression');
  return data.data;
}

export async function deleteAlbumImage(albumId, imageId) {
  const res = await fetch(`/api/gallery/${albumId}?image=${encodeURIComponent(imageId)}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression');
  return data.data;
}

// --- Capture (depuis le studio visio) ---
export async function captureSnapshot({ eventId, classId, image, caption } = {}) {
  const res = await fetch('/api/media/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, classId, image, caption }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Échec de la capture');
  return data.data; // { albumId, image }
}
