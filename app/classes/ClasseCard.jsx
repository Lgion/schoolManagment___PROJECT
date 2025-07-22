// Carte d'affichage d'une classe (ClasseCard)
import React from 'react';
import Link from "next/link";
import './ClasseCard.scss';

export default function ClasseCard({ classe, onEdit, onClick }) {
  if (!classe) return null;
  return (
    <div className="person-card-wrapper" style={{position:'relative'}}>
      <Link href={`/classes/${classe._id}`} className="classe-card" tabIndex={0}>
        <div className="classe-card__header">
          <span className="classe-card__niveau">{classe.niveau}</span>
          <span className="classe-card__alias">{classe.alias}</span>
          <span className="classe-card__annee">{classe.annee}</span>
        </div>
        <div className="classe-card__infos">
          {classe.photo && (
            <img className="classe-card__photo" src={classe.photo} alt={classe.niveau + ' ' + classe.alias} />
          )}
          <div className="classe-card__details">
            <div><b>Effectif :</b> {classe.eleves_count ?? classe.eleves?.length ?? '—'}</div>
            <div><b>Prof principal :</b> {classe.prof_principal_nom || classe.prof_principal || '—'}</div>
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
