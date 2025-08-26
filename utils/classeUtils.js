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
 * Composant d'affichage de plusieurs classes (pour les enseignants)
 * @param {Array} classes - Liste des classes à afficher
 * @param {Array} classeIds - IDs des classes assignées
 * @param {string} label - Label à afficher avant les classes
 * @returns {JSX.Element} - Élément JSX pour l'affichage des classes
 */
export const MultiClasseDisplay = ({ classes, classeIds, label = "Classes assignées :" }) => {
  if (!Array.isArray(classeIds) || classeIds.length === 0) {
    return (
      <div className="person-detail__classe" style={{marginBottom:'1em'}}>
        <u>{label}</u> <span style={{color:'grey'}}>Aucune classe assignée</span>
      </div>
    );
  }

  const assignedClasses = classeIds.map(id => findClasseById(classes, id)).filter(Boolean);

  return (
    <div className="person-detail__classe" style={{marginBottom:'1em'}}>
      <u>{label}</u> 
      {assignedClasses.length > 0 ? (
        <div style={{marginTop:'0.5em'}}>
          {assignedClasses.map(classe => (
            <div key={classe._id} style={{marginBottom:'0.25em'}}>
              <Link href={`/classes/${classe._id}`}>{classe.niveau} - {classe.alias}</Link>
            </div>
          ))}
        </div>
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
    if (entityType === 'eleves') {
      // Pour les élèves : current_classe est un ObjectId simple
      const classeId = entity.current_classe;
      classe = findClasseById(ctx.classes, classeId);
    } else {
      // Pour les enseignants : current_classes est un array, on prend la première classe
      const classeIds = entity.current_classes;
      if (Array.isArray(classeIds) && classeIds.length > 0) {
        classe = findClasseById(ctx.classes, classeIds[0]);
      }
    }
  }
  
  return { entity, classe };
};
