// Helpers client pour les bulletins scolaires.

export async function generateReportCards(classId, { schoolYear, period, appreciations }) {
  const res = await fetch(`/api/classes/${classId}/report-cards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolYear, period, appreciations }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la génération des bulletins');
  return data.data; // { count, cards }
}

export async function fetchClassReportCards(classId, { schoolYear, period } = {}) {
  const qs = new URLSearchParams();
  if (schoolYear) qs.set('schoolYear', schoolYear);
  if (period) qs.set('period', period);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/classes/${classId}/report-cards${suffix}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des bulletins');
  return data.data;
}

export async function fetchStudentReportCards(studentId) {
  const res = await fetch(`/api/students/${studentId}/report-cards`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des bulletins');
  return data.data;
}

// Banque de phrases pour l'appréciation générale (insertion rapide).
export const APPRECIATION_BANK = [
  'Très bon trimestre, continue ainsi.',
  'Élève sérieux et appliqué.',
  'Ensemble satisfaisant.',
  'Des résultats en progrès.',
  'Manque de concentration en classe.',
  'Doit fournir des efforts plus réguliers.',
  'Trimestre difficile, ne te décourage pas.',
  'Excellent travail, félicitations !',
];
