"use client";

import { useState } from 'react';
import { createAppointment, personLabel, STATUS_LABEL_PRESETS } from './appointmentsApi';

/**
 * Formulaire (modale) de demande de rendez-vous / convocation.
 * Props :
 *   - initiatorRole : 'parent' | 'prof'
 *   - studentId : ObjectId de l'élève concerné
 *   - teachers : [{_id,nom,prenoms}] — requis quand un parent initie (choix du prof)
 *   - onClose() / onCreated(appointment)
 */
export default function AppointmentModal({ initiatorRole, studentId, teachers = [], onClose, onCreated }) {
  const [teacherRef, setTeacherRef] = useState(teachers[0]?._id || '');
  const [statusLabel, setStatusLabel] = useState(STATUS_LABEL_PRESETS[0]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [formats, setFormats] = useState(['PRESENTIAL']);
  const [slots, setSlots] = useState([{ start: '', end: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleFormat = (f) =>
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const setSlot = (i, key, val) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

  const addSlot = () => setSlots((prev) => [...prev, { start: '', end: '' }]);
  const removeSlot = (i) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (initiatorRole === 'parent' && !teacherRef) {
      setError('Sélectionnez un enseignant.');
      return;
    }
    if (formats.length === 0) {
      setError('Choisissez au moins un format.');
      return;
    }
    const proposedDates = [];
    for (const s of slots) {
      if (!s.start) continue;
      const startDate = new Date(s.start);
      const endDate = s.end ? new Date(s.end) : new Date(startDate.getTime() + 30 * 60000);
      if (Number.isNaN(startDate.getTime()) || endDate < startDate) {
        setError('Un créneau proposé est invalide.');
        return;
      }
      proposedDates.push({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    }
    if (proposedDates.length === 0) {
      setError('Proposez au moins une date.');
      return;
    }

    setSubmitting(true);
    try {
      const appt = await createAppointment({
        initiatorRole,
        studentId,
        teacherRef: initiatorRole === 'parent' ? teacherRef : undefined,
        title,
        statusLabel,
        proposedDates,
        meetingFormatOptions: formats,
        message,
      });
      onCreated?.(appt);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="appointmentModal__overlay" onClick={onClose}>
      <div className="appointmentModal" onClick={(e) => e.stopPropagation()}>
        <header className="appointmentModal__header">
          <h3>{initiatorRole === 'prof' ? 'Solliciter / Convoquer un parent' : 'Demander un rendez-vous'}</h3>
          <button type="button" className="appointmentModal__close" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <form className="appointmentModal__form" onSubmit={submit}>
          {initiatorRole === 'parent' && teachers.length > 1 && (
            <label className="appointmentModal__field">
              <span>Enseignant</span>
              <select value={teacherRef} onChange={(e) => setTeacherRef(e.target.value)}>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{personLabel(t)}</option>
                ))}
              </select>
            </label>
          )}

          <label className="appointmentModal__field">
            <span>Type de demande</span>
            <input
              list="appt-status-presets"
              value={statusLabel}
              onChange={(e) => setStatusLabel(e.target.value)}
              placeholder="Demande de rdv, Convocation…"
            />
            <datalist id="appt-status-presets">
              {STATUS_LABEL_PRESETS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </label>

          <label className="appointmentModal__field">
            <span>Objet (optionnel)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Court intitulé" />
          </label>

          <fieldset className="appointmentModal__field appointmentModal__slots">
            <legend>Date(s) proposée(s)</legend>
            {slots.map((s, i) => (
              <div className="appointmentModal__slot" key={i}>
                <input type="datetime-local" value={s.start} onChange={(e) => setSlot(i, 'start', e.target.value)} />
                <span className="appointmentModal__slot-sep">→</span>
                <input type="datetime-local" value={s.end} onChange={(e) => setSlot(i, 'end', e.target.value)} />
                {slots.length > 1 && (
                  <button type="button" className="appointmentModal__slot-remove" onClick={() => removeSlot(i)} aria-label="Retirer">×</button>
                )}
              </div>
            ))}
            <button type="button" className="appointmentModal__addSlot" onClick={addSlot}>+ Ajouter une alternative</button>
          </fieldset>

          <fieldset className="appointmentModal__field appointmentModal__formats">
            <legend>Format proposé</legend>
            <label><input type="checkbox" checked={formats.includes('PRESENTIAL')} onChange={() => toggleFormat('PRESENTIAL')} /> 🏫 Présentiel</label>
            <label><input type="checkbox" checked={formats.includes('VISIO')} onChange={() => toggleFormat('VISIO')} /> 🎥 Visio</label>
          </fieldset>

          <label className="appointmentModal__field">
            <span>Motif / message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Précisez le motif de la rencontre…" />
          </label>

          {error && <p className="appointmentModal__error">{error}</p>}

          <div className="appointmentModal__actions">
            <button type="button" className="appointmentModal__btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="appointmentModal__btn appointmentModal__btn--primary" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
