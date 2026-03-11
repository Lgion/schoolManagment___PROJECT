import React from "react";
import Link from "next/link";
import { useDetailPortal } from '../../stores/useDetailPortal';
import './EleveCard.scss';
import PermissionGate from "../components/PermissionGate";

// Utilitaire pour progression scolarité (argent/riz)
function getScolarityProgress(fees, isInterne = false) {
  // Récupérer les frais selon le statut interne/externe
  const interneFeesStr = process.env.NEXT_PUBLIC_INTERNE_FEES || '45000 50';
  const externeFeesStr = process.env.NEXT_PUBLIC_EXTERNE_FEES || '18000 25';

  const [interneArgent, interneRiz] = interneFeesStr.split(' ').map(Number);
  const [externeArgent, externeRiz] = externeFeesStr.split(' ').map(Number);

  const targetArgent = isInterne ? interneArgent : externeArgent;
  const targetRiz = isInterne ? interneRiz : externeRiz;

  let totalArgent = 0, totalRiz = 0;
  if (fees && typeof fees === 'object') {
    Object.values(fees).forEach(yearData => {
      if (yearData && typeof yearData === 'object') {
        Object.values(yearData).forEach(dayData => {
          if (Array.isArray(dayData)) {
            // Nouveau format : array de dépôts
            dayData.forEach(deposit => {
              if (deposit.argent) totalArgent += Number(deposit.argent);
              if (deposit.riz) totalRiz += Number(deposit.riz);
            });
          } else if (dayData && typeof dayData === 'object') {
            // Ancien format : objet unique (rétrocompatibilité)
            if (dayData.argent) totalArgent += Number(dayData.argent);
            if (dayData.riz) totalRiz += Number(dayData.riz);
          }
        });
      }
    });
  }
  return {
    argent: Math.min(100, Math.round((totalArgent / targetArgent) * 100)),
    riz: Math.min(100, Math.round((totalRiz / targetRiz) * 100)),
    totalArgent,
    totalRiz,
    targetArgent,
    targetRiz
  };
}

export default function EleveCard({ classe, eleve, onEdit, viewMode = 'grid' }) {
  const prenoms = Array.isArray(eleve.prenoms) ? eleve.prenoms.join(', ') : eleve.prenoms;
  // Priorité : Cloudinary → Fichier local → Avatar par défaut
  const photoUrl = eleve.cloudinary?.url || eleve.photo_$_file || eleve.photo || '/default-avatar.png';
  const isInterne = eleve.isInterne;
  const fees = eleve.scolarity_fees_$_checkbox || {};
  const progress = getScolarityProgress(fees, isInterne);
  const { openPortal } = useDetailPortal();


  return (
    <li className={"eleve-card-wrapper " + eleve.sexe.toLowerCase()} style={{ position: 'relative' }}>
      <Link
        href={`/eleves/${eleve._id}`}
        className={`eleve-card ${viewMode === 'inline' ? 'eleve-card--inline' : ''}`}
        tabIndex={0}
      >
        <img className="eleve-card__photo" src={photoUrl} alt={eleve.nom + ' ' + prenoms} />
        <div className="eleve-card__infos">
          <div className="eleve-card__name_classe">
            <div className="eleve-card__name">{eleve.nom} <span className="eleve-card__prenoms">{prenoms}</span></div>
            <div className="eleve-card__classe">{classe.niveau} - {classe.alias}</div>
          </div>
          <div className="eleve-card__isinterne">
            {isInterne ? <span className="eleve-card__isinterne-badge">Interne</span> : <span className="eleve-card__isinterne-badge eleve-card__isinterne-badge--externe">Externe</span>}
          </div>
          <div className="eleve-card__progress">
            <div className="eleve-card__progress-label">Frais Scolarité</div>
            <div className="eleve-card__progress-bar" title={`Argent: ${progress.totalArgent} F / ${progress.targetArgent} F ||| Riz: ${progress.totalRiz} kg / ${progress.targetRiz} kg`} data-argent={progress.argent + '% argent versé'} data-riz={progress.riz + '% riz versé'}>
              <div className="eleve-card__progress-argent" style={{ width: progress.argent + '%' }} title={`Argent: ${progress.totalArgent} F / ${progress.targetArgent} F`}></div>
              <div className="eleve-card__progress-riz" style={{ width: progress.riz + '%' }} title={`Riz: ${progress.totalRiz} kg / ${progress.targetRiz} kg`}></div>
            </div>
            <div className="eleve-card__progress-values">
              <span className="eleve-card__progress-valueArgent">{progress.totalArgent} F <span>({progress.argent + '%'})</span></span> |
              <span className="eleve-card__progress-valueRiz">{progress.totalRiz} kg riz <span>({progress.riz + '%'})</span></span>
            </div>
          </div>
        </div>
        <PermissionGate roles={['admin', 'prof']}>
          {onEdit && (
            <button
              type="button"
              className="eleve-card__editbtn"
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, padding: '0.3em 0.7em', fontSize: '0.95em', background: '#fff', border: '1px solid #bbb', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}
              onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(eleve); }}
              tabIndex={0}
            >Éditer</button>
          )}
        </PermissionGate>
      </Link>
    </li>
  );
}
