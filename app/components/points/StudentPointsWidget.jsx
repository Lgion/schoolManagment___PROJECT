"use client";
import { useState, useEffect, useRef } from 'react';
import { fetchBalance, fetchHistory, formatTeacherName } from './pointsApi';
import { PALIERS, getPalierState } from './paliers';
import { burstConfetti, playChime } from './celebrate';
import { getLSItem, setLSItem } from '../../../utils/localStorageManager';

// "12/06" — date courte FR
function shortDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

/**
 * Widget « Bons points » pour la page d'un élève (vues élève / parent).
 * - Dashboard : solde total mis en avant + badges de paliers débloqués.
 * - Historique : liste lisible de chaque transaction.
 * - Célébration (spec §4) : si `celebrateOnNew`, des confettis + un carillon se
 *   déclenchent quand l'élève découvre des points gagnés depuis sa dernière visite.
 *
 * Props : studentId, refreshKey (optionnel), celebrateOnNew (défaut false)
 */
export default function StudentPointsWidget({ studentId, refreshKey, celebrateOnNew = false }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gained, setGained] = useState(0); // delta de points découverts → toast
  const celebratedFor = useRef(null);      // évite de re-célébrer le même solde

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [bal, hist] = await Promise.all([
          fetchBalance(studentId),
          fetchHistory(studentId),
        ]);
        if (cancelled) return;
        setSummary(bal);
        setHistory(hist);

        // Détection « nouveaux points depuis la dernière visite »
        if (celebrateOnNew) {
          const key = `points_seen_${studentId}`;
          const prev = getLSItem(key);
          if (prev !== null && prev !== undefined && bal.balance > prev && celebratedFor.current !== bal.balance) {
            celebratedFor.current = bal.balance;
            setGained(bal.balance - prev);
            burstConfetti();
            playChime();
            setTimeout(() => setGained(0), 4500);
          }
          setLSItem(key, bal.balance);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, refreshKey, celebrateOnNew]);

  const balance = summary?.balance ?? 0;
  const { current, next, progress } = getPalierState(balance);

  return (
    <div className="studentPoints">
      {/* Toast « nouveaux points » */}
      {gained > 0 && (
        <div className="studentPoints__toast" role="status">
          🎉 Bravo ! Tu as gagné <b>+{gained}</b> nouveau{gained > 1 ? 'x' : ''} point{gained > 1 ? 's' : ''} !
        </div>
      )}

      {/* Dashboard solde */}
      <div className={`studentPoints__dashboard ${balance > 0 ? '--pos' : balance < 0 ? '--neg' : '--zero'}`}>
        <div className="studentPoints__badge">
          <span className="studentPoints__badge-value">{loading ? '…' : `${balance > 0 ? '+' : ''}${balance}`}</span>
          <span className="studentPoints__badge-label">Bons points</span>
        </div>
        {summary && !loading && (
          <div className="studentPoints__breakdown">
            <span className="studentPoints__breakdown-item --bonus">⭐ {summary.totalBonus > 0 ? '+' : ''}{summary.totalBonus} bonus</span>
            <span className="studentPoints__breakdown-item --malus">⚠️ {summary.totalMalus} malus</span>
            <span className="studentPoints__breakdown-item --count">{summary.transactionCount} entrée{summary.transactionCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Paliers / récompenses */}
      {!loading && (
        <div className="studentPoints__paliers">
          <div className="studentPoints__paliers-head">
            <span className="studentPoints__paliers-title">
              {current ? <>Niveau actuel : <b>{current.icon} {current.name}</b></> : 'Aucun palier atteint'}
            </span>
            {next && (
              <span className="studentPoints__paliers-next">
                {next.threshold - balance} pt{next.threshold - balance > 1 ? 's' : ''} → {next.icon} {next.name}
              </span>
            )}
          </div>
          {next && (
            <div className="studentPoints__progress" title={`${Math.round(progress * 100)} % vers ${next.name}`}>
              <div className="studentPoints__progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          <div className="studentPoints__badges">
            {PALIERS.map(p => {
              const unlocked = balance >= p.threshold;
              return (
                <div
                  key={p.threshold}
                  className={`studentPoints__palierBadge ${unlocked ? '--unlocked' : '--locked'}`}
                  title={unlocked ? `${p.name} débloqué (${p.threshold} pts)` : `${p.name} — à ${p.threshold} pts`}
                >
                  <span className="studentPoints__palierBadge-icon">{p.icon}</span>
                  <span className="studentPoints__palierBadge-name">{p.name}</span>
                  <span className="studentPoints__palierBadge-th">{p.threshold}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="studentPoints__history">
        <h3 className="studentPoints__history-title">Historique</h3>
        {error ? (
          <div className="studentPoints__error">{error}</div>
        ) : loading ? (
          <div className="studentPoints__loading">Chargement…</div>
        ) : history.length === 0 ? (
          <div className="studentPoints__empty">Aucun bon point pour le moment.</div>
        ) : (
          <ul className="studentPoints__list">
            {history.map(tx => {
              const isBonus = tx.amount >= 0;
              return (
                <li key={tx._id} className={`studentPoints__item ${isBonus ? '--bonus' : '--malus'}`}>
                  <span className="studentPoints__item-amount">{isBonus ? '+' : ''}{tx.amount}</span>
                  <span className="studentPoints__item-icon">{tx.labelId?.icon || (isBonus ? '⭐' : '⚠️')}</span>
                  <span className="studentPoints__item-label">{tx.labelId?.name || 'Point'}</span>
                  <span className="studentPoints__item-teacher">({formatTeacherName(tx.teacherId)})</span>
                  {tx.comment && <span className="studentPoints__item-comment">— {tx.comment}</span>}
                  <span className="studentPoints__item-date">le {shortDate(tx.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
