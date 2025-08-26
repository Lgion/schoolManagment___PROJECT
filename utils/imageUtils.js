/**
 * Utilitaires pour la gestion des chemins d'images selon l'architecture hybride
 */

/**
 * Génère le chemin d'image pour une classe selon la structure hiérarchique
 * @param {Object} classe - Objet classe avec niveau, alias, annee
 * @returns {string} - Chemin vers l'image de classe
 */
export const getClasseImagePath = (classe) => {
  if (!classe || !classe.niveau || !classe.alias || !classe.annee) {
    return '/school/classe.webp'; // Image par défaut
  }
  
  // Normalisation selon la logique API
  const niveau = String(classe.niveau).toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  const alias = String(classe.alias).toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  const annee = String(classe.annee).replace(/[^a-zA-Z0-9-]/g, '');
  
  const classeFolder = `${niveau}-${alias}`;
  const imagePath = `/school/classes/${classeFolder}/${annee}/photo.webp`;
  
  return imagePath;
};

/**
 * Génère le chemin d'image pour un élève
 * @param {Object} eleve - Objet élève avec nom, prenoms, naissance_$_date
 * @returns {string} - Chemin vers l'image d'élève
 */
export const getEleveImagePath = (eleve) => {
  if (!eleve || !eleve.nom || !eleve.prenoms || !eleve.naissance_$_date) {
    return '/school/default-student.webp';
  }
  
  const eleveFolder = `${eleve.nom}-${eleve.prenoms}-${eleve.naissance_$_date}`.replace(/--+/g, '-');
  return `/school/students/${eleveFolder}/photo.webp`;
};

/**
 * Génère le chemin d'image pour un enseignant
 * @param {Object} enseignant - Objet enseignant avec nom, prenoms
 * @returns {string} - Chemin vers l'image d'enseignant
 */
export const getEnseignantImagePath = (enseignant) => {
  if (!enseignant || !enseignant.nom || !enseignant.prenoms) {
    return '/school/default-teacher.webp';
  }
  
  const enseignantFolder = `${enseignant.nom}-${enseignant.prenoms}`.replace(/--+/g, '-').replace(',', '-');
  return `/school/teachers/${enseignantFolder}/photo.webp`;
};
