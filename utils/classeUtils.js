/**
 * Utilitaires pour la gestion des classes
 * Applique la logique DRY pour éviter la duplication de code
 */

import Link from 'next/link';

/**
 * Trouve une classe par son ID dans la liste des classes
 * @param {Array} classes - Liste des classes disponibles
 * @param {string} classeId - ID de la classe à rechercher
 * @returns {Object|null} - Classe trouvée ou null
 */
export const findClasseById = (classes, classeId) => {
  if (!classes || !classeId) return null;
  return classes.find(c => c._id === classeId) || null;
};

/**
 * Composant d'affichage d'une classe avec gestion des cas d'erreur
 * @param {Object} classe - Objet classe à afficher
 * @param {string} label - Label à afficher avant la classe
 * @returns {JSX.Element} - Élément JSX pour l'affichage de la classe
 */
export const ClasseDisplay = ({ classe, label = "Classe :" }) => {
  return (
    <div className="person-detail__classe" style={{marginBottom:'1em'}}>
      <u>{label}</u> {classe && classe._id ? (
        <Link href={`/classes/${classe._id}`}>{classe.niveau} - {classe.alias}</Link>
      ) : (
        <span style={{color:'grey'}}>Aucune classe assignée</span>
      )}
    </div>
  );
};

/**
 * Hook personnalisé pour gérer la logique commune des pages de détail
 * @param {string} id - ID de l'entité
 * @param {Object} ctx - Contexte de l'application
 * @param {string} entityType - Type d'entité ('eleves' ou 'enseignants')
 * @returns {Object} - Objet contenant l'entité et la classe associée
 */
export const useEntityDetail = (id, ctx, entityType) => {
  const entities = ctx[entityType] || [];
  const entity = entities.find(e => String(e._id) === String(id));
  
  let classe = null;
  if (entity) {
    const classeId = entityType === 'eleves' ? entity.current_classe : entity.current_classes;
    classe = findClasseById(ctx.classes, classeId);
  }
  
  return { entity, classe };
};
