// Carte d'affichage d'une classe (ClasseCard)
import React from "react";
import Link from "next/link";
import { useDetailPortal } from '../../stores/useDetailPortal';
import './ClasseCard.scss';
import { getClasseImagePath } from '../../utils/imageUtils';
import PermissionGate from "../components/PermissionGate";

export default function ClasseCard({ classe, enseignants, eleves: elevesFromProp, onEdit, onOpenModal }) {
  if (!classe) return null;
  const { openPortal } = useDetailPortal();

  // Déterminer l'effectif : priorité au tableau d'élèves passé en prop (filtré dynamiquement)
  // Sinon on utilise le tableau d'IDs stocké dans le document de classe
  const effectif = elevesFromProp 
    ? elevesFromProp.length 
    : (classe?.eleves?.length ?? 0);

  // Gestion sécurisée du professeur principal
  let enseignantObj = null
  let enseignantNom = '—' // Tiret par défaut

  if (enseignants && enseignants.length > 0 && classe.professeur && classe.professeur.length > 0) {
    // Nouvelle logique : récupérer l'enseignant à partir du champ professeur de la classe
    const premierProfId = classe.professeur[0]
    enseignantObj = enseignants.find(enseignant => String(enseignant._id) === String(premierProfId))

    if (enseignantObj) {
      const nom = enseignantObj.nom || ''
      const prenoms = Array.isArray(enseignantObj.prenoms)
        ? enseignantObj.prenoms.join(' ')
        : enseignantObj.prenoms || ''
      enseignantNom = `${nom} ${prenoms}`.trim()
    }

    // Fallback : ancienne logique pour compatibilité avec les anciennes classes
    if (!enseignantObj && classe.professeur && classe.professeur.length > 0) {
      const premierProf = classe.professeur[0]

      if (typeof premierProf === 'string') {
        enseignantObj = enseignants.find(el => String(el._id) === String(premierProf))
      } else if (typeof premierProf === 'object' && premierProf !== null) {
        if (premierProf._id) {
          enseignantObj = enseignants.find(el => String(el._id) === String(premierProf._id))
        } else if (premierProf.nom) {
          enseignantNom = `${premierProf.nom || ''} ${Array.isArray(premierProf.prenoms) ? premierProf.prenoms.join(' ') : premierProf.prenoms || ''}`.trim()
        }
      }

      if (enseignantObj && enseignantNom === '—') {
        const nom = enseignantObj.nom || ''
        const prenoms = Array.isArray(enseignantObj.prenoms)
          ? enseignantObj.prenoms.join(' ')
          : enseignantObj.prenoms || ''
        enseignantNom = `${nom} ${prenoms}`.trim()
      }
    }
  }

  return (
    <div className="person-card-wrapper" style={{ position: 'relative' }}>
      <Link
        href={`/classes/${classe._id}`}
        className="classe-card"
        tabIndex={0}
      >
        <div className="classe-card__header">
          <span className="classe-card__niveau">{classe.niveau}</span>
          <span className="classe-card__alias">{classe.alias}</span>
          <span className="classe-card__annee">{classe.annee}</span>
        </div>
        <div className="classe-card__infos">
          <img
            className="classe-card__photo"
            src={getClasseImagePath(classe)}
            alt={`${classe.niveau} ${classe.alias} - ${classe.annee}`}
            onError={(e) => {
              e.target.src = '/school/classe.webp';
            }}
          />
          <div className="classe-card__details">
            <div><b>Effectif :</b> {effectif}</div>
            <div><b>Professeur principal :</b> {enseignantNom}</div>
          </div>
        </div>
        <PermissionGate roles={['admin', 'prof']}>
          {onEdit && (
            <button
              type="button"
              className="classe-card__editbtn"
              onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(classe); }}
            >Éditer</button>
          )}
        </PermissionGate>
      </Link>
    </div>
  );
}
