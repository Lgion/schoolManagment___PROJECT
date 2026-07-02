'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchHomework, toggleHomework, groupByDay, formatDayLabel } from './homeworkApi';

// Clé jour 'YYYY-MM-DD' (UTC) d'aujourd'hui — cohérente avec le stockage serveur.
function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

// 'YYYY-MM-DD' (UTC) il y a N jours — borne basse pour récupérer les devoirs en retard.
function daysAgoKeyUTC(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Cahier de texte côté élève / parent : liste « À faire » regroupée par jour,
 * avec cases à cocher pour marquer un devoir comme terminé.
 */
export default function HomeworkTodoList({ studentId, classId, interactive = true }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      // On remonte 14 jours en arrière pour récupérer les devoirs en retard,
      // puis on ne garde du passé que ceux qui ne sont pas encore faits.
      const all = await fetchHomework(classId, { studentId, from: daysAgoKeyUTC(14) });
      const today = todayKeyUTC();
      const visible = all.filter((h) => {
        const day = new Date(h.dateDue).toISOString().slice(0, 10);
        return day >= today || !h.done;
      });
      setHomework(visible);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (h) => {
    if (!interactive) return;
    // Optimiste
    setHomework((prev) => prev.map((x) => (x._id === h._id ? { ...x, done: !x.done } : x)));
    try {
      const { done } = await toggleHomework(studentId, h._id);
      setHomework((prev) => prev.map((x) => (x._id === h._id ? { ...x, done } : x)));
    } catch (e) {
      // Revert
      setHomework((prev) => prev.map((x) => (x._id === h._id ? { ...x, done: h.done } : x)));
      setError(e.message);
    }
  };

  if (loading) return <p className="homeworkTodo__loading">Chargement…</p>;
  if (error) return <p className="homeworkTodo__error">{error}</p>;
  if (homework.length === 0) {
    return <p className="homeworkTodo__empty">Aucun devoir à venir. 🎉</p>;
  }

  const groups = groupByDay(homework);

  return (
    <div className="homeworkTodo">
      {groups.map(({ day, items }) => (
        <div key={day} className="homeworkTodo__group">
          <h4 className="homeworkTodo__day">📅 Pour {formatDayLabel(day)}</h4>
          <ul className="homeworkTodo__list">
            {items.map((h) => (
              <li key={h._id} className={`homeworkTodo__item ${h.done ? '--done' : ''}`}>
                <label className="homeworkTodo__label">
                  <input
                    type="checkbox"
                    checked={!!h.done}
                    disabled={!interactive}
                    onChange={() => toggle(h)}
                  />
                  <span className="homeworkTodo__subject">{h.subject}</span>
                  <span className="homeworkTodo__content">{h.content}</span>
                  {h.estimatedTime ? (
                    <span className="homeworkTodo__time">⏱️ {h.estimatedTime} min</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
