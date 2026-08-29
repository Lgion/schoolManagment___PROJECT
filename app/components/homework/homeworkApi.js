// Helpers client pour le cahier de texte (devoirs).
// Fetch simple : l'authentification Clerk passe par les cookies (middleware).

// 'YYYY-MM-DD' local — cohérent avec <input type="date">.
export function todayLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Devoirs d'une classe à partir d'aujourd'hui (ou d'une période), avec statut élève optionnel.
export async function fetchHomework(classId, { from, to, studentId } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (studentId) qs.set('studentId', studentId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/classes/${classId}/homework${suffix}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des devoirs');
  return data.data;
}

export async function createHomework(classId, payload) {
  const res = await fetch(`/api/classes/${classId}/homework`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de l\'ajout du devoir');
  return data.data;
}

export async function updateHomework(id, payload) {
  const res = await fetch(`/api/homework/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la modification');
  return data.data;
}

export async function deleteHomework(id) {
  const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression');
  return data.data;
}

export async function toggleHomework(studentId, homeworkId) {
  const res = await fetch(`/api/students/${studentId}/homework/${homeworkId}/toggle`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour');
  return data.data; // { done }
}

// --- Utilitaires d'affichage ---

// Regroupe une liste plate de devoirs par jour de rendu (clé 'YYYY-MM-DD' UTC).
export function groupByDay(homework) {
  const groups = new Map();
  for (const h of homework) {
    const key = new Date(h.dateDue).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(h);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => ({ day, items }));
}

// 'YYYY-MM-DD' (UTC) -> "Lundi 15 octobre"
export function formatDayLabel(dayKey) {
  try {
    const d = new Date(`${dayKey}T00:00:00Z`);
    const label = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch (_) {
    return dayKey;
  }
}
