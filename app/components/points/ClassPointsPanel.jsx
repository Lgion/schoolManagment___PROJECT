"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEleveImagePath } from '../../../utils/imageUtils';
import { fetchBalance } from './pointsApi';
import AwardPointsModal from './AwardPointsModal';

// Nom lisible d'un élève (prenoms peut être array ou string)
function studentName(e) {
  const prenoms = Array.isArray(e.prenoms) ? e.prenoms.join(' ') : (e.prenoms || '');
  return `${e.nom || ''} ${prenoms}`.trim();
}

/**
 * Panneau de gestion des bons points d'une classe (côté professeur).
 * - Affiche le solde de chaque élève d'un coup d'œil.
 * - Permet la sélection multiple (bulk) pour attribuer un même label en une action.
 * - Permet l'attribution individuelle via le bouton de chaque ligne.
 *
 * Props : eleves (array d'élèves résolus depuis le contexte)
 */
export default function ClassPointsPanel({ eleves = [] }) {
  const [balances, setBalances] = useState({}); // { [studentId]: number }
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // studentIds cochés
  const [modalRecipients, setModalRecipients] = useState(null); // null = fermé

  const studentIds = useMemo(() => eleves.map(e => e._id), [eleves]);

  const loadBalances = useCallback(async () => {
    if (studentIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.all(
        studentIds.map(id => fetchBalance(id).then(b => [id, b.balance]).catch(() => [id, 0]))
      );
      setBalances(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }, [studentIds]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(prev => prev.length === eleves.length ? [] : eleves.map(e => e._id));

  const openBulk = () => {
    const recipients = eleves
      .filter(e => selected.includes(e._id))
      .map(e => ({ _id: e._id, name: studentName(e) }));
    if (recipients.length) setModalRecipients(recipients);
  };

  const openSingle = (e) =>
    setModalRecipients([{ _id: e._id, name: studentName(e) }]);

  const handleSuccess = () => {
    setSelected([]);
    loadBalances();
  };

  if (eleves.length === 0) {
    return <div className="classPoints__empty">Aucun élève dans cette classe.</div>;
  }

  return (
    <div className="classPoints">
      <div className="classPoints__toolbar">
        <button
          type="button"
          className="classPoints__selectAll"
          onClick={toggleAll}
        >
          {selected.length === eleves.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <span className="classPoints__count">{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>
        <button
          type="button"
          className="classPoints__bulkBtn"
          onClick={openBulk}
          disabled={selected.length === 0}
        >
          🎖️ Attribuer aux sélectionnés
        </button>
      </div>

      <ul className="classPoints__list">
        {eleves.map(e => {
          const bal = balances[e._id] ?? 0;
          const checked = selected.includes(e._id);
          return (
            <li key={e._id} className={`classPoints__row ${checked ? '--checked' : ''}`}>
              <label className="classPoints__check">
                <input type="checkbox" checked={checked} onChange={() => toggle(e._id)} />
              </label>
              <img
                className="classPoints__avatar"
                src={getEleveImagePath(e)}
                alt={studentName(e)}
                onError={(ev) => { ev.target.src = '/school/student.webp'; }}
              />
              <span className="classPoints__name">{studentName(e)}</span>
              <span className={`classPoints__balance ${bal > 0 ? '--pos' : bal < 0 ? '--neg' : '--zero'}`}>
                {loading ? '…' : `${bal > 0 ? '+' : ''}${bal}`}
              </span>
              <button
                type="button"
                className="classPoints__rowBtn"
                onClick={() => openSingle(e)}
                title="Attribuer des points à cet élève"
              >
                + Points
              </button>
            </li>
          );
        })}
      </ul>

      <AwardPointsModal
        isOpen={modalRecipients !== null}
        recipients={modalRecipients || []}
        onClose={() => setModalRecipients(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
