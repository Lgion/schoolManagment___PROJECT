// Carte générique pour élève ou enseignant
import React, { useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import Link from "next/link";
import { getEleveImagePath, getEnseignantImagePath } from '../../utils/imageUtils';
import PermissionGate from "./PermissionGate";
import './PersonCard.scss';

export default function PersonCard({ person, classes, onClick, onEdit, type, viewMode = 'grid' }) {
  const { targetDefinitions } = useContext(AiAdminContext);
  const photoUrl = type === 'eleve'
    ? getEleveImagePath(person)
    : type === 'enseignant'
      ? getEnseignantImagePath(person)
      : person.photo_$_file || '/default-photo.png';

  // Classe « sexe » pour la teinte de la carte (gérée par le CSS tokenisé,
  // identique aux cartes élèves — voir couche de cohérence index.scss)
  const genreClass = (() => {
    const s = person.sexe;
    if (s === 'M' || s === 'Garçon' || s === 'garcon' || s === 'Masculin') return 'm';
    if (s === 'F' || s === 'Fille' || s === 'fille' || s === 'Féminin') return 'f';
    return '';
  })();

  return (
    <div className={`person-card-wrapper ${genreClass}`} style={{ position: 'relative' }}>
      <Link
        href={`/${type}s/${person._id}`}
        className={`person-card ${viewMode === 'inline' ? 'person-card--inline' : ''}`}
        tabIndex={0}
      >
        <img className="person-card__photo" src={photoUrl} alt={person.nom + ' ' + person.prenoms} />
        <div className="person-card__infos">
          <div className="person-card__name">{person.nom} <span className="person-card__prenoms">{person.prenoms}</span></div>
          <div className="person-card__sexe">Sexe : {person.sexe === 'M' ? 'Masculin' : person.sexe === 'F' ? 'Féminin' : '-'}</div>
          <div className="person-card__classe">
            {Array.isArray(classes) && classes.map(el => el?.niveau + " - " + el?.alias).join(', ')}
          </div>
          {/* Badge ou champ spécifique selon le type */}
          {type === 'eleve' && (
            <div className="person-card__isinterne" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(() => {
                const targetsList = person.targetsList || {};
                const activeProfiling = [];
                (targetDefinitions || []).forEach(td => {
                  const val = targetsList[td.key];
                  if (val) {
                    activeProfiling.push({ key: td.key, value: Array.isArray(val) ? val.join(', ') : val });
                  } else if (td.key.startsWith('is')) {
                    activeProfiling.push({ key: td.key, value: td.options[1] });
                  }
                });
                return activeProfiling.map((p) => (
                  <span key={p.key} className={`person-card__isinterne-badge ${p.value === 'Externe' ? 'person-card__isinterne-badge--externe' : ''}`}>{p.value}</span>
                ));
              })()}
            </div>
          )}
        </div>
        <PermissionGate roles={['admin', 'prof']}>
          {onEdit && (
            <button
              type="button"
              className="person-card__editbtn"
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
              onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(person); }}
              tabIndex={0}
            >Éditer</button>
          )}
        </PermissionGate>
      </Link>
    </div>
  );
}
