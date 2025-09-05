// Carte générique pour élève ou enseignant
import React from 'react';
import Link from "next/link";
import './PersonCard.scss';

export default function PersonCard({ person, classes, onClick, onEdit, type, viewMode = 'grid' }) {
  const photoUrl = person.photo_$_file || '/default-photo.png';
  
  // Couleur de fond selon le sexe
  const getBackgroundColor = (sexe) => {
    if (sexe === 'Garçon' || sexe === 'garcon' || sexe === 'M' || sexe === 'Masculin') {
      return 'rgba(54, 162, 235, 0.1)'; // Bleu très léger
    } else if (sexe === 'Fille' || sexe === 'fille' || sexe === 'F' || sexe === 'Féminin') {
      return 'rgba(255, 99, 132, 0.1)'; // Rose très léger
    }
    return 'transparent';
  };

  console.log(person.nom);
  console.log(classes);
  
  return (
    <div className="person-card-wrapper" style={{position:'relative'}}>
      <Link href={`/${type}s/${person._id}`} className={`person-card ${viewMode === 'inline' ? 'person-card--inline' : ''}`} tabIndex={0} style={{backgroundColor: getBackgroundColor(person.sexe)}}>
        <img className="person-card__photo" src={photoUrl} alt={person.nom + ' ' + person.prenoms} />
        <div className="person-card__infos">
          <div className="person-card__name">{person.nom} <span className="person-card__prenoms">{person.prenoms}</span></div>
          <div className="person-card__sexe">Sexe : {person.sexe === 'M' ? 'Masculin' : person.sexe === 'F' ? 'Féminin' : '-'}</div>
          <div className="person-card__classe">{classes.map(el=>el?.niveau+" - "+el?.alias)}</div>
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
