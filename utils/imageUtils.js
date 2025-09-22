/**
 * Utilitaires pour la gestion des chemins d'images selon l'architecture hybride
 */

/**
 * Génère le chemin d'image pour une classe selon la structure hiérarchique
 * @param {Object} classe - Objet classe avec niveau, alias, annee
 * @returns {string} - Chemin vers l'image de classe
 */
export const getClasseImagePath = (classe) => {
  // Priorité : Cloudinary → photo → Image par défaut
  if (classe?.cloudinary?.url) {
    return classe.cloudinary.url;
  }
  
  if (classe?.photo && classe.photo !== "") {
    return classe.photo;
  }
  
  return '/school/classe.webp'; // Image par défaut pour classes
};

/**
 * Génère le chemin d'image pour un élève
 * @param {Object} eleve - Objet élève avec nom, prenoms, naissance_$_date
 * @returns {string} - Chemin vers l'image d'élève
 */
export const getEleveImagePath = (eleve) => {
  // Priorité : Cloudinary → photo_$_file → Image par défaut
  if (eleve?.cloudinary?.url) {
    return eleve.cloudinary.url;
  }
  
  if (eleve?.photo_$_file && eleve.photo_$_file !== "") {
    return eleve.photo_$_file;
  }
  
  return '/school/student.webp'; // Image par défaut pour élèves
};

/**
 * Génère le chemin d'image pour un enseignant
 * @param {Object} enseignant - Objet enseignant avec nom, prenoms
 * @returns {string} - Chemin vers l'image d'enseignant
 */
export const getEnseignantImagePath = (enseignant) => {
  // Priorité : Cloudinary → photo_$_file → Image par défaut
  if (enseignant?.cloudinary?.url) {
    return enseignant.cloudinary.url;
  }
  
  if (enseignant?.photo_$_file && enseignant.photo_$_file !== "") {
    return enseignant.photo_$_file;
  }
  
  return '/school/prof.webp'; // Image par défaut pour enseignants
};
