// Carte d'affichage d'une classe (ClasseCard)
import React from "react";
import Link from "next/link";
import './ClasseCard.scss';
import { getClasseImagePath } from '../../utils/imageUtils';

export default function ClasseCard({ classe, enseignants, onEdit, onClick }) {
  if (!classe) return null;
  
  // Gestion sécurisée du professeur principal
  let enseignantObj = null
  let enseignantNom = '—' // Tiret par défaut
  
  if (enseignants && enseignants.length > 0) {
    // Nouvelle logique : chercher l'enseignant qui a classe._id dans son array current_classes
    enseignantObj = enseignants.find(enseignant => 
      Array.isArray(enseignant.current_classes) && enseignant.current_classes.includes(classe._id)
    )
    
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
        enseignantObj = enseignants.find(el => el._id === premierProf)
      } else if (typeof premierProf === 'object' && premierProf !== null) {
        if (premierProf._id) {
          enseignantObj = enseignants.find(el => el._id === premierProf._id)
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
    <div className="person-card-wrapper" style={{position:'relative'}}>
      <Link href={`/classes/${classe._id}`} className="classe-card" tabIndex={0}>
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
            <div><b>Effectif :</b> {classe?.eleves?.length ?? '—'}</div>
            <div><b>Professeur principal :</b> {enseignantNom}</div>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            className="classe-card__editbtn"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(classe); }}
          >Éditer</button>
        )}
      </Link>
    </div>
  );
}
