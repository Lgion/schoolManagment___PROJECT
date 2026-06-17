// Helpers client pour la gestion des présences (l'appel).
// Fetch simple : l'authentification Clerk passe par les cookies (middleware).

// Enregistre une session d'appel complète.
export async function saveAttendance(classId, { date, period, entries }) {
  const res = await fetch(`/api/classes/${classId}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, period, entries }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de l\'enregistrement de l\'appel');
  return data.data;
}

// Récupère la session d'un jour précis (pour pré-remplir / modifier).
export async function fetchSession(classId, date, period = 'MATIN') {
  const res = await fetch(`/api/classes/${classId}/attendance?date=${date}&period=${period}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement de l\'appel');
  return data.data; // { record, entries }
}

// Récupère l'historique des sessions d'une classe (récapitulatif par session).
export async function fetchHistory(classId, limit = 60) {
  const res = await fetch(`/api/classes/${classId}/attendance?limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement de l\'historique');
  return data.data;
}

// Met à jour le statut/commentaire d'un élève sur un appel existant.
export async function updateEntry(entryId, { status, comment }) {
  const res = await fetch(`/api/attendance/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour');
  return data.data;
}

// Récapitulatif des présences d'un élève (compteurs + historique récent).
export async function fetchStudentAttendance(studentId) {
  const res = await fetch(`/api/students/${studentId}/attendance`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des présences');
  return data.data;
}

// --- Constantes UI partagées ---
// Cycle de clics façon Klassly : Présent → Absent → Retard → Présent.
export const STATUS_CYCLE = ['PRESENT', 'ABSENT', 'LATE'];

export const STATUS_META = {
  PRESENT: { label: 'Présent', short: 'Présents', icon: '✅', mod: 'present' },
  ABSENT: { label: 'Absent', short: 'Absents', icon: '❌', mod: 'absent' },
  LATE: { label: 'Retard', short: 'Retards', icon: '⏱️', mod: 'late' },
  EXCUSED: { label: 'Excusé', short: 'Excusés', icon: '📝', mod: 'excused' },
};

// Statut suivant dans le cycle de clics.
export function nextStatus(current) {
  const i = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}
