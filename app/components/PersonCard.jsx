// Carte générique pour élève ou enseignant
import React from 'react';
import Link from "next/link";
import './PersonCard.scss';

export default function PersonCard({ person, classe, onClick, onEdit, type }) {
  const photoUrl = person.photo_$_file || '/default-photo.png';

  return (
    <div className="person-card-wrapper" style={{position:'relative'}}>
      <Link href={`/${type}s/${person._id}`} className="person-card" tabIndex={0} >
        <img className="person-card__photo" src={photoUrl} alt={person.nom + ' ' + person.prenoms} />
        <div className="person-card__infos">
          <div className="person-card__name">{person.nom} <span className="person-card__prenoms">{person.prenoms}</span></div>
          <div className="person-card__sexe">Sexe : {person.sexe === 'M' ? 'Masculin' : person.sexe === 'F' ? 'Féminin' : '-'}</div>
          <div className="person-card__classe">{classe?.niveau} - {classe?.alias}</div>
          {/* Badge ou champ spécifique selon le type */}
          {type === 'eleve' && (
            <div className="person-card__isinterne">
              {person.isInterne
                ? <span className="person-card__isinterne-badge">Interne</span>
                : <span className="person-card__isinterne-badge person-card__isinterne-badge--externe">Externe</span>
              }
            </div>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            className="person-card__editbtn"
            style={{position:'absolute',top:8,right:8,zIndex:2}}
            onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(person); }}
            tabIndex={0}
          >Éditer</button>
        )}
      </Link>
    </div>
  );
}
