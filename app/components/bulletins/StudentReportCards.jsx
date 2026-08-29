'use client';
import { useState, useEffect } from 'react';
import { PERIOD_LABELS } from '../../../utils/bulletins';
import { fetchStudentReportCards } from './bulletinsApi';
import { downloadBulletinPdf } from './bulletinPdf';

const fmt = (n) => (n == null ? '—' : Number(n).toFixed(2));

/**
 * Bulletins d'un élève (côté élève / parent / prof) : liste épurée + téléchargement PDF.
 */
export default function StudentReportCards({ studentId, studentName, className }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchStudentReportCards(studentId)
      .then((d) => { if (alive) setCards(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [studentId]);

  if (loading) return <p className="studentBulletins__loading">Chargement…</p>;
  if (error) return <p className="studentBulletins__error">{error}</p>;
  if (cards.length === 0) {
    return <p className="studentBulletins__empty">Aucun bulletin disponible pour le moment.</p>;
  }

  return (
    <ul className="studentBulletins">
      {cards.map((c) => (
        <li key={c._id} className="studentBulletins__row">
          <div className="studentBulletins__info">
            <span className="studentBulletins__period">
              {PERIOD_LABELS[c.period] || c.period} — {c.schoolYear}
            </span>
            <span className="studentBulletins__avg">
              Moyenne : {fmt(c.globalAverage)}/20
              {c.rank && c.classSize ? ` · Rang ${c.rank}/${c.classSize}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="studentBulletins__dl"
            onClick={() => downloadBulletinPdf(c, { studentName, className })}
          >
            📄 Télécharger
          </button>
        </li>
      ))}
    </ul>
  );
}
