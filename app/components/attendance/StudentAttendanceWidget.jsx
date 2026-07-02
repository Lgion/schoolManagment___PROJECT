'use client';
import { useState, useEffect } from 'react';
import { fetchStudentAttendance, STATUS_META } from './attendanceApi';

function formatDay(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (_) {
    return '';
  }
}

/**
 * Récapitulatif des présences d'un élève (côté élève/parent et prof).
 * Compteurs absences/retards + liste des derniers évènements notables.
 */
export default function StudentAttendanceWidget({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchStudentAttendance(studentId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [studentId]);

  if (loading) return <p className="attendanceWidget__loading">Chargement…</p>;
  if (error) return <p className="attendanceWidget__error">{error}</p>;
  if (!data || data.total === 0) {
    return <p className="attendanceWidget__empty">Aucun appel enregistré pour le moment.</p>;
  }

  const { summary, recent } = data;

  return (
    <div className="attendanceWidget">
      <div className="attendanceWidget__counters">
        {['ABSENT', 'LATE', 'EXCUSED'].map((s) => (
          <div key={s} className={`attendanceWidget__counter attendanceWidget__counter--${STATUS_META[s].mod}`}>
            <span className="attendanceWidget__icon">{STATUS_META[s].icon}</span>
            <span className="attendanceWidget__num">{summary[s]}</span>
            <span className="attendanceWidget__label">{STATUS_META[s].short}</span>
          </div>
        ))}
      </div>

      {recent && recent.length > 0 && (
        <ul className="attendanceWidget__list">
          {recent.map((r, i) => (
            <li key={i} className="attendanceWidget__row">
              <span className={`attendanceWidget__tag attendanceWidget__tag--${STATUS_META[r.status].mod}`}>
                {STATUS_META[r.status].icon} {STATUS_META[r.status].label}
              </span>
              <span className="attendanceWidget__date">{formatDay(r.date)}</span>
              {r.comment && <span className="attendanceWidget__comment">{r.comment}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
