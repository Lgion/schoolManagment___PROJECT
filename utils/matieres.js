/**
 * Configuration des matières scolaires
 * Constante pour garantir la cohérence des noms de matières
 */

export const MATIERES_SCOLAIRES = [
  'Mathématiques',
  'Exploration de texte',
  'Éveil au milieu',
  'Dictée', 
  'Français', 
  'Anglais',
  'Sciences Physiques',
  'Sciences de la Vie et de la Terre',
  'Histoire-Géographie',
  'Philosophie',
  'Éducation Physique',
  'Arts Plastiques',
  'Musique',
  'Informatique',
  'Économie',
  'Autre matière'
];

// Coefficients par matière (utilisés comme dénominateur par défaut)
export const COEFFICIENTS_MATIERES = {
  'Mathématiques': 40,
  'Exploration de texte': 30,
  'Éveil au milieu': 20,
  'Dictée': 20,
  'Français': 40,
  'Anglais': 30,
  'Sciences Physiques': 30,
  'Sciences de la Vie et de la Terre': 30,
  'Histoire-Géographie': 30,
  'Philosophie': 20,
  'Éducation Physique': 10,
  'Arts Plastiques': 10,
  'Musique': 10,
  'Informatique': 20,
  'Économie': 20,
  'Autre matière': 20
};

/**
 * Convertit l'ancien format de notes (nombres) vers le nouveau format (objets)
 * @param {Array} oldNotes - Ancien format [15, 12, 18]
 * @returns {Array} - Nouveau format [{"Autre matière": 15}, {"Autre matière": 12}]
 */
export const convertOldNotesToNew = (oldNotes) => {
  if (!Array.isArray(oldNotes)) return [];
  return oldNotes.map(note => {
    if (typeof note === 'object' && note !== null) {
      // Déjà au nouveau format
      return note;
    }
    // Ancien format (nombre) -> nouveau format
    return { "Autre matière": Number(note) };
  });
};

/**
 * Extrait la première matière et note d'un objet note
 * @param {Object} noteObj - Objet note {"Mathématiques": 15}
 * @returns {Object} - {matiere: "Mathématiques", note: 15}
 */
export const extractMatiereNote = (noteObj) => {
  if (!noteObj || typeof noteObj !== 'object') return { matiere: 'Autre matière', note: 0 };
  const entries = Object.entries(noteObj);
  if (entries.length === 0) return { matiere: 'Autre matière', note: 0 };
  const [matiere, note] = entries[0];
  return { matiere, note: Number(note) };
};
