// Carte d'affichage d'une classe (ClasseCard)
import React from "react";
import Link from "next/link";
import './ClasseCard.scss';
import { getClasseImagePath } from '../../utils/imageUtils';

export default function ClasseCard({ classe, enseignants, onEdit, onClick }) {
  if (!classe) return null;
  let enseignant = enseignants.find(el=>el._id==classe.professeur[0])
  console.log(enseignant);
  
  enseignant = `${enseignant.nom} ${enseignant.prenoms}`
  console.log(classe);
  
  console.log("classe.professeur");
  console.log(classe.professeur);
  console.log(enseignants);
  
  
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
              e.target.src = '/school/default-classe.webp';
            }}
          />
          <div className="classe-card__details">
            <div><b>Effectif :</b> {classe?.eleves?.length ?? '—'}</div>
            <div><b>Professeur principal :</b> {enseignant}</div>
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
