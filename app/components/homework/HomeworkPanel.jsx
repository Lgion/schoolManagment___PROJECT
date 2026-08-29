'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchHomework, deleteHomework, groupByDay, formatDayLabel } from './homeworkApi';
import HomeworkModal from './HomeworkModal';

/**
 * Cahier de texte côté professeur : liste des devoirs à venir regroupés par jour
 * de rendu, avec ajout / modification / suppression.
 */
export default function HomeworkPanel({ classId }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHomework(await fetchHomework(classId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (h) => { setEditing(h); setModalOpen(true); };

  const handleDelete = async (h) => {
    if (!window.confirm(`Supprimer le devoir de ${h.subject} ?`)) return;
    try {
      await deleteHomework(h._id);
      setHomework((prev) => prev.filter((x) => x._id !== h._id));
    } catch (e) {
      setError(e.message);
    }
  };

  const groups = groupByDay(homework);

  return (
    <div className="homework">
      <div className="homework__toolbar">
        <span className="homework__count">{homework.length} devoir(s) à venir</span>
        <button type="button" className="homework__addBtn" onClick={openCreate}>
          + Ajouter un devoir
        </button>
      </div>

      {error && <div className="homework__error">{error}</div>}

      {loading ? (
        <p className="homework__loading">Chargement…</p>
      ) : groups.length === 0 ? (
        <p className="homework__empty">Aucun devoir à venir.</p>
      ) : (
        <div className="homework__groups">
          {groups.map(({ day, items }) => (
            <div key={day} className="homework__group">
              <h4 className="homework__day">📅 {formatDayLabel(day)}</h4>
              <ul className="homework__list">
                {items.map((h) => (
                  <li key={h._id} className="homework__item">
                    <div className="homework__main">
                      <span className="homework__subject">{h.subject}</span>
                      <span className="homework__content">{h.content}</span>
                      {h.estimatedTime ? (
                        <span className="homework__time">⏱️ {h.estimatedTime} min</span>
                      ) : null}
                    </div>
                    <div className="homework__actions">
                      <button type="button" onClick={() => openEdit(h)} title="Modifier">✏️</button>
                      <button type="button" onClick={() => handleDelete(h)} title="Supprimer">🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <HomeworkModal
        isOpen={modalOpen}
        classId={classId}
        entry={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
