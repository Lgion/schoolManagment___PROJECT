import React from "react";
import Link from "next/link";
import './EleveCard.scss';

// Utilitaire pour progression scolarité (argent/riz)
function getScolarityProgress(fees) {
  let totalArgent = 0, totalRiz = 0;
  if (fees && typeof fees === 'object') {
    Object.values(fees).forEach(v => {
      if (v.argent) totalArgent += Number(v.argent);
      if (v.riz) totalRiz += Number(v.riz);
    });
  }
  return {
    argent: Math.min(100, Math.round((totalArgent / 20000) * 100)),
    riz: Math.min(100, Math.round((totalRiz / 50) * 100)),
    totalArgent,
    totalRiz
  };
}

export default function EleveCard({ classe, eleve, onEdit }) {
  const prenoms = Array.isArray(eleve.prenoms) ? eleve.prenoms.join(', ') : eleve.prenoms;
  const photoUrl = eleve.photo_$_file || eleve.photo || '/default-avatar.png';
  const isInterne = eleve.isInterne;
  const fees = eleve.scolarity_fees_$_checkbox || {};
  const progress = getScolarityProgress(fees);
  
  // Couleur de fond selon le sexe
  const getBackgroundColor = (sexe) => {
    if (sexe === 'Garçon' || sexe === 'garcon' || sexe === 'M' || sexe === 'Masculin') {
      return 'rgba(54, 162, 235, 0.1)'; // Bleu très léger
    } else if (sexe === 'Fille' || sexe === 'fille' || sexe === 'F' || sexe === 'Féminin') {
      return 'rgba(255, 99, 132, 0.1)'; // Rose très léger
    }
    return 'transparent';
  };

  return (
    <div className="eleve-card-wrapper" style={{position:'relative'}}>
      <Link href={`/eleves/${eleve._id}`} className="eleve-card" tabIndex={0} style={{backgroundColor: getBackgroundColor(eleve.sexe)}}>
        <img className="eleve-card__photo" src={photoUrl} alt={eleve.nom + ' ' + prenoms} />
        <div className="eleve-card__infos">
          <div className="eleve-card__name">{eleve.nom} <span className="eleve-card__prenoms">{prenoms}</span></div>
          <div className="eleve-card__classe">{classe.niveau} - {classe.alias}</div>
          <div className="eleve-card__isinterne">
            {isInterne ? <span className="eleve-card__isinterne-badge">Interne</span> : <span className="eleve-card__isinterne-badge eleve-card__isinterne-badge--externe">Externe</span>}
          </div>
          <div className="eleve-card__progress">
            <div className="eleve-card__progress-label">Scolarité</div>
            <div className="eleve-card__progress-bar">
              <div className="eleve-card__progress-argent" style={{width: progress.argent + '%'}} title={`Argent: ${progress.totalArgent} F / 20000 F`}></div>
              <div className="eleve-card__progress-riz" style={{width: progress.riz + '%'}} title={`Riz: ${progress.totalRiz} kg / 50 kg`}></div>
            </div>
            <div className="eleve-card__progress-values">
              <span className="eleve-card__progress-value">{progress.totalArgent} F</span> |
              <span className="eleve-card__progress-value">{progress.totalRiz} kg riz</span>
            </div>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            className="eleve-card__editbtn"
            style={{position:'absolute',top:8,right:8,zIndex:2,padding:'0.3em 0.7em',fontSize:'0.95em',background:'#fff',border:'1px solid #bbb',borderRadius:'6px',cursor:'pointer',boxShadow:'0 1px 4px #0001'}}
            onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(eleve); }}
            tabIndex={0}
          >Éditer</button>
        )}
      </Link>
    </div>
  );
}
