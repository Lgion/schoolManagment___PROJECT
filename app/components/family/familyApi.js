// Helpers client pour les espaces famille (parent / élève) et la config d'accès.

// Récupère l'utilisateur courant (avec roleData peuplé : childrenRefs / eleveRef).
export async function fetchUserWithRefs(clerkId) {
  const res = await fetch(`/api/users/${clerkId}`);
  if (!res.ok) throw new Error('Impossible de charger le profil');
  return res.json();
}

// Configure les clés de correspondance d'un élève (staff). Renvoie l'état à jour.
export async function updateStudentAccount(studentId, payload) {
  const res = await fetch(`/api/students/${studentId}/account`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la configuration');
  return data.data;
}

// "Jean-Pierre Dupont" depuis un doc élève (prenoms peut être un tableau).
export function studentFullName(eleve) {
  if (!eleve) return '';
  const prenoms = Array.isArray(eleve.prenoms) ? eleve.prenoms.join(' ') : (eleve.prenoms || '');
  return `${eleve.nom || ''} ${prenoms}`.trim();
}
