import React, { useContext } from "react";
import Link from "next/link";
import { useDetailPortal } from '../../stores/useDetailPortal';
import './EleveCard.scss';
import PermissionGate from "../components/PermissionGate";
import { AiAdminContext } from '../../stores/ai_adminContext';

// Utilitaire pour progression scolarité (dynamique via targetsList)
function getScolarityProgress(fees, targetsList, feeDefinitions, normalizeFeeItem, resolveTargetAmount) {
  const totals = {};
  const targets = {};
  
  feeDefinitions.forEach(def => {
    totals[def.id] = 0;
    
    targets[def.id] = resolveTargetAmount(def, targetsList);
  });

  if (fees && typeof fees === 'object') {
    Object.values(fees).forEach(yearData => {
      if (yearData && typeof yearData === 'object') {
        Object.values(yearData).forEach(dayData => {
          const deposits = Array.isArray(dayData) ? dayData : (dayData && typeof dayData === 'object' ? [dayData] : []);
          deposits.forEach(deposit => {
            const normalized = normalizeFeeItem(deposit);
            if (normalized && totals[normalized.feeId] !== undefined) {
              totals[normalized.feeId] += normalized.amount;
            }
          });
        });
      }
    });
  }

  return feeDefinitions.map(def => ({
    id: def.id,
    label: def.label,
    unit: def.unit,
    percent: targets[def.id] > 0 ? Math.min(100, Math.round((totals[def.id] / targets[def.id]) * 100)) : 0,
    total: totals[def.id],
    target: targets[def.id]
  }));
}

export default function EleveCard({ classe, eleve, onEdit, viewMode = 'grid' }) {
  const { feeDefinitions, feeDefinitionsLoaded, normalizeFeeItem, resolveTargetAmount, targetDefinitions } = useContext(AiAdminContext);
  const prenoms = Array.isArray(eleve.prenoms) ? eleve.prenoms.join(', ') : eleve.prenoms;
  const photoUrl = eleve.cloudinary?.url || eleve.photo_$_file || eleve.photo || '/default-avatar.png';
  
  const targetsList = eleve.targetsList || {};
  const fees = eleve.scolarity_fees_$_checkbox || {};
  
  const progress = feeDefinitionsLoaded 
    ? getScolarityProgress(fees, targetsList, feeDefinitions, normalizeFeeItem, resolveTargetAmount) 
    : [];

  const progressColors = ["#ff8c00", "#800080", "#00ff00", "#0000ff", "#ff0000", "#00ffff", "#ffff00", "#ff00ff", "#008000", "#000080", "#800000", "#808000", "#800080", "#008080", "#000000", "#ffffff"];
  const { openPortal } = useDetailPortal();

  // Profiling badges to show (including fallbacks for is*)
  const activeProfiling = [];
  targetDefinitions.forEach(td => {
    const val = targetsList[td.key];
    if (val) {
      activeProfiling.push({ key: td.key, value: Array.isArray(val) ? val.join(', ') : val });
    } else if (td.key.startsWith('is')) {
      // Fallback for boolean fields
      activeProfiling.push({ key: td.key, value: td.options[1] });
    }
    // For do* or other, if missing, we don't add anything (user's request)
  });

  // Build title string dynamically
  const titleParts = progress.map(p => `${p.label}: ${p.total} ${p.unit} / ${p.target} ${p.unit}`);
  const isComplete = progress.length > 0 && progress.every(p => p.percent === 100);

  return (
    <li className={"eleve-card-wrapper " + eleve.sexe.toLowerCase()} style={{ position: 'relative' }}>
      <Link
        href={`/eleves/${eleve._id}`}
        className={`eleve-card ${isComplete ? "eleve-card--isComplete" : ""} ${viewMode === 'inline' ? 'eleve-card--inline' : ''}`}
        tabIndex={0}
      >
        <img className="eleve-card__photo" src={photoUrl} alt={eleve.nom + ' ' + prenoms} />
        <div className="eleve-card__infos">
          <div className="eleve-card__name_classe">
            <div className="eleve-card__name">{eleve.nom} <span className="eleve-card__prenoms">{prenoms}</span></div>
            <div className="eleve-card__classe">{classe.niveau} - {classe.alias}</div>
          </div>
          <div className="eleve-card__isinterne">
            {activeProfiling.map(p => (
              <span key={p.key} className={`eleve-card__isinterne-badge ${p.value === 'Externe' ? 'eleve-card__isinterne-badge--externe' : ''}`}>
                {p.value}
              </span>
            ))}
          </div>
          <div className="eleve-card__progress">
            <div className="eleve-card__progress-label">Frais Scolarité</div>
            {progress.length > 0 ? (
               <>
                <div className="eleve-card__progress-bar" title={titleParts.join(' | ')}>
                  {progress.map((p, i) => (
                    <div
                      key={p.id}
                      className={`eleve-card__progress-segment eleve-card__progress-segment--${i}`}
                      style={{ width: (p.percent) + '%', background: progressColors[i] }}
                      title={`${p.label}: ${p.total} ${p.unit} / ${p.target} ${p.unit}`}
                    />
                  ))}
                </div>
                <div className="eleve-card__progress-values">
                  {progress.map((p, i) => (
                    <span key={p.id} className={`eleve-card__progress-value eleve-card__progress-value--${i}`} style={{ background: progressColors[i] }}>
                      {p.total} {p.unit} ({p.percent}%)
                    </span>
                  ))}
                </div>
               </>
            ) : (
              <div className="eleve-card__progress-empty">Aucun frais défini</div>
            )}
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
