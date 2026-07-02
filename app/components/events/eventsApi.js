// Helpers client pour les événements (école & classe).
// L'authentification Clerk passe par les cookies (middleware).

// Métadonnées d'affichage par type d'événement (couleur + icône + libellé).
export const EVENT_TYPE_META = {
  SORTIE: { label: 'Sortie', icon: '🚌', color: '#2e9e6b' },
  EVALUATION: { label: 'Évaluation', icon: '📝', color: '#e67e22' },
  REUNION: { label: 'Réunion', icon: '👥', color: '#3478c4' },
  FERMETURE: { label: 'Fermeture', icon: '🚪', color: '#7a7f87' },
  AUTRE: { label: 'Autre', icon: '📌', color: '#7e57c2' },
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_META);

export function typeMeta(type) {
  return EVENT_TYPE_META[type] || EVENT_TYPE_META.AUTRE;
}

export async function fetchEvents({ classId, from, to } = {}) {
  const qs = new URLSearchParams();
  if (classId) qs.set('classId', classId);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/events${suffix}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des événements');
  return data.data;
}

export async function createEvent(payload) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la création');
  return data.data;
}

export async function updateEvent(id, payload) {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la modification');
  return data.data;
}

export async function deleteEvent(id) {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression');
  return data.data;
}

// --- Formatage ---

// Date ISO stockée → valeur pour <input type="datetime-local"> (heure locale).
export function isoToLocalInput(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (_) {
    return '';
  }
}

// "Lundi 15 octobre, 14:00 – 16:00" (ou sur deux jours si plage multi-jours).
export function formatEventWhen(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dayFmt = { weekday: 'long', day: 'numeric', month: 'long' };
  const timeFmt = { hour: '2-digit', minute: '2-digit' };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${cap(start.toLocaleDateString('fr-FR', dayFmt))}, ${start.toLocaleTimeString('fr-FR', timeFmt)} – ${end.toLocaleTimeString('fr-FR', timeFmt)}`;
  }
  return `${cap(start.toLocaleDateString('fr-FR', dayFmt))} → ${cap(end.toLocaleDateString('fr-FR', dayFmt))}`;
}

// 'YYYY-MM-DD' local d'une date.
export function dayKeyLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
