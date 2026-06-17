'use client';
import { useState, useEffect } from 'react';
import { createHomework, updateHomework, todayLocal } from './homeworkApi';

// 'YYYY-MM-DD' local pour demain (date de rendu par défaut).
function tomorrowLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 'YYYY-MM-DD' à partir d'une date ISO stockée (UTC).
function isoToDayInput(iso) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch (_) { return tomorrowLocal(); }
}

/**
 * Modale de saisie d'un devoir (création ou édition).
 * `entry` non nul = mode édition.
 */
export default function HomeworkModal({ isOpen, classId, entry, onClose, onSaved }) {
  const [subject, setSubject] = useState('');
  const [dateDue, setDateDue] = useState(tomorrowLocal);
  const [content, setContent] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (entry) {
      setSubject(entry.subject || '');
      setDateDue(isoToDayInput(entry.dateDue));
      setContent(entry.content || '');
      setEstimatedTime(entry.estimatedTime ? String(entry.estimatedTime) : '');
    } else {
      setSubject('');
      setDateDue(tomorrowLocal());
      setContent('');
      setEstimatedTime('');
    }
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!subject.trim()) { setError('La matière est requise'); return; }
    if (!content.trim()) { setError('Les consignes sont requises'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        subject: subject.trim(),
        dateDue,
        content: content.trim(),
        estimatedTime: estimatedTime ? parseInt(estimatedTime, 10) : null,
      };
      const saved = entry
        ? await updateHomework(entry._id, payload)
        : await createHomework(classId, payload);
      onSaved && onSaved(saved);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="homeworkModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="homeworkModal__container">
        <div className="homeworkModal__header">
          <h3>{entry ? 'Modifier le devoir' : 'Nouveau devoir'}</h3>
          <button type="button" onClick={onClose} disabled={submitting}>✕</button>
        </div>

        <div className="homeworkModal__body">
          <label className="homeworkModal__field">
            <span>Matière</span>
            <input
              type="text"
              value={subject}
              placeholder="Mathématiques, Histoire…"
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <div className="homeworkModal__row">
            <label className="homeworkModal__field">
              <span>À rendre pour le</span>
              <input
                type="date"
                value={dateDue}
                min={todayLocal()}
                onChange={(e) => setDateDue(e.target.value)}
              />
            </label>
            <label className="homeworkModal__field">
              <span>Temps estimé (min)</span>
              <input
                type="number"
                min="0"
                value={estimatedTime}
                placeholder="15"
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </label>
          </div>

          <label className="homeworkModal__field">
            <span>Consignes</span>
            <textarea
              rows={5}
              value={content}
              placeholder="Faire l'exercice 3 page 42…"
              onChange={(e) => setContent(e.target.value)}
            />
          </label>

          {error && <div className="homeworkModal__error">{error}</div>}
        </div>

        <div className="homeworkModal__footer">
          <button type="button" onClick={onClose} disabled={submitting}>Annuler</button>
          <button
            type="button"
            className="homeworkModal__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Enregistrement…' : entry ? 'Enregistrer' : 'Ajouter le devoir'}
          </button>
        </div>
      </div>
    </div>
  );
}
