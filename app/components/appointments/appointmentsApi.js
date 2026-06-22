// Helpers client pour les rendez-vous / convocations parent ↔ prof.
// Auth Clerk via cookies (middleware) → fetch nu.

export const APPOINTMENT_STATUS_META = {
  PENDING: { label: 'En attente', icon: '⏳', color: '#e67e22' },
  ACCEPTED: { label: 'Confirmé', icon: '✅', color: '#2e9e6b' },
  REJECTED: { label: 'Refusé', icon: '⛔', color: '#c0392b' },
  CANCELED: { label: 'Annulé', icon: '🚫', color: '#7a7f87' },
  COMPLETED: { label: 'Terminé', icon: '🏁', color: '#3478c4' },
};

export const MEETING_FORMAT_META = {
  PRESENTIAL: { label: 'Présentiel', icon: '🏫' },
  VISIO: { label: 'Visio', icon: '🎥' },
};

// Intitulés par défaut proposés dans le formulaire (saisie libre possible).
export const STATUS_LABEL_PRESETS = [
  'Demande de rdv',
  'Convocation',
  'Information urgente',
  'Suivi de scolarité',
];

export function statusMeta(status) {
  return APPOINTMENT_STATUS_META[status] || APPOINTMENT_STATUS_META.PENDING;
}

export function formatMeta(format) {
  return MEETING_FORMAT_META[format] || null;
}

export function personLabel(ref) {
  if (!ref) return 'Inconnu';
  const prenoms = Array.isArray(ref.prenoms) ? ref.prenoms.join(' ') : ref.prenoms || '';
  return `${ref.nom || ''} ${prenoms}`.trim() || 'Inconnu';
}

export function formatRange(range) {
  if (!range?.startDate) return '';
  const start = new Date(range.startDate);
  const end = range.endDate ? new Date(range.endDate) : null;
  const dayStr = start.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  const startStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const endStr = end ? end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  return endStr ? `${dayStr} ${startStr}–${endStr}` : `${dayStr} ${startStr}`;
}

// Conversion <input type="datetime-local"> ↔ ISO (heure locale).
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export async function fetchAppointments({ studentId, status, direction } = {}) {
  const qs = new URLSearchParams();
  if (studentId) qs.set('studentId', studentId);
  if (status) qs.set('status', status);
  if (direction) qs.set('direction', direction);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/appointments${suffix}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des rendez-vous');
  return data.data;
}

export async function createAppointment(payload) {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible de créer le rendez-vous');
  return data.data;
}

export async function updateAppointment(id, body) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour');
  return data.data;
}
