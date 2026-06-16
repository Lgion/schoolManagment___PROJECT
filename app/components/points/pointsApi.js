// Helpers client pour le système de bons points.
// Fetch simple : l'authentification Clerk passe par les cookies (middleware),
// aucun header supplémentaire n'est nécessaire.

export async function fetchLabels(type) {
  const qs = type ? `?type=${type}` : '';
  const res = await fetch(`/api/points/labels${qs}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des catégories');
  return data.data;
}

export async function createLabel({ name, type, icon, defaultAmount }) {
  const res = await fetch('/api/points/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, icon, defaultAmount }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur création de la catégorie');
  return data.data;
}

export async function awardPoints({ studentIds, labelId, amount, comment }) {
  const res = await fetch('/api/points/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentIds, labelId, amount, comment }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de l\'attribution');
  return data.data;
}

export async function fetchBalance(studentId) {
  const res = await fetch(`/api/students/${studentId}/points`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement du solde');
  return data.data;
}

export async function fetchHistory(studentId, limit = 100) {
  const res = await fetch(`/api/students/${studentId}/points/history?limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement de l\'historique');
  return data.data;
}

// Met en forme un nom de prof peuplé (populate `nom prenoms`) -> "M. Dupont".
export function formatTeacherName(teacher) {
  if (!teacher) return 'École';
  const prenom = Array.isArray(teacher.prenoms) ? teacher.prenoms[0] : teacher.prenoms;
  const initiale = prenom ? `${prenom[0]}. ` : '';
  return `${initiale}${teacher.nom || ''}`.trim() || 'École';
}
