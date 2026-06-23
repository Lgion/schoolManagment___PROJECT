'use client';
import { useState, useEffect } from 'react';
import { createEvent, updateEvent, isoToLocalInput, EVENT_TYPES, typeMeta } from './eventsApi';
import VisioLauncher from '../visio/VisioLauncher';

// datetime-local par défaut : prochaine heure pleine.
function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function plusOneHour(localValue) {
  const d = new Date(localValue);
  d.setHours(d.getHours() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Modale de création / édition d'un événement.
 * - `event` non nul = édition.
 * - `defaultClassId` : si fourni, l'événement est rattaché à cette classe par défaut.
 * - `canGlobal` : autorise la bascule « Événement école (global) » (réservé admin).
 */
export default function EventModal({ isOpen, event, defaultClassId = null, canGlobal = false, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('AUTRE');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [notifyParents, setNotifyParents] = useState(false);
  const [hasVisio, setHasVisio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (event) {
      setTitle(event.title || '');
      setType(event.type || 'AUTRE');
      setStart(isoToLocalInput(event.startDate));
      setEnd(isoToLocalInput(event.endDate));
      setLocation(event.location || '');
      setDescription(event.description || '');
      setIsGlobal(Boolean(event.isGlobal));
      setNotifyParents(Boolean(event.notifyParents));
      setHasVisio(Boolean(event.hasVisio));
    } else {
      const s = defaultStart();
      setTitle('');
      setType('AUTRE');
      setStart(s);
      setEnd(plusOneHour(s));
      setLocation('');
      setDescription('');
      setIsGlobal(canGlobal && !defaultClassId);
      setNotifyParents(false);
      setHasVisio(false);
    }
  }, [isOpen, event, canGlobal, defaultClassId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Le titre est requis'); return; }
    if (!start || !end) { setError('Les dates de début et de fin sont requises'); return; }
    if (new Date(end) < new Date(start)) { setError('La date de fin doit suivre la date de début'); return; }
    const global = canGlobal ? isGlobal : false;
    if (!global && !defaultClassId) { setError('Aucune classe cible pour cet événement'); return; }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        type,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        isGlobal: global,
        classId: global ? null : defaultClassId,
        location: location.trim(),
        description: description.trim(),
        notifyParents,
        hasVisio,
      };
      const saved = event ? await updateEvent(event._id, payload) : await createEvent(payload);
      onSaved?.(saved);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="eventModal__overlay" onClick={onClose}>
      <div className="eventModal" onClick={(e) => e.stopPropagation()}>
        <header className="eventModal__header">
          <h3 className="eventModal__title">{event ? 'Modifier l\'événement' : 'Nouvel événement'}</h3>
          <button className="eventModal__close" onClick={onClose} aria-label="Fermer">✕</button>
        </header>

        {error && <div className="eventModal__error">{error}</div>}

        <div className="eventModal__body">
          <label className="eventModal__field">
            <span>Titre</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Sortie au musée" />
          </label>

          <label className="eventModal__field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{typeMeta(t).icon} {typeMeta(t).label}</option>
              ))}
            </select>
          </label>

          <div className="eventModal__row">
            <label className="eventModal__field">
              <span>Début</span>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (!end || new Date(end) < new Date(e.target.value)) setEnd(plusOneHour(e.target.value));
                }}
              />
            </label>
            <label className="eventModal__field">
              <span>Fin</span>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>

          <label className="eventModal__field">
            <span>Lieu (optionnel)</span>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Gymnase, Musée d'Orsay…" />
          </label>

          <label className="eventModal__field">
            <span>Description (optionnel)</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Affaires à prévoir, détails…" />
          </label>

          {canGlobal && (
            <label className="eventModal__check">
              <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
              <span>Événement école (visible de tous){!defaultClassId ? '' : ' — sinon rattaché à cette classe'}</span>
            </label>
          )}

          <label className="eventModal__check">
            <input type="checkbox" checked={notifyParents} onChange={(e) => setNotifyParents(e.target.checked)} />
            <span>Notifier les parents (à venir)</span>
          </label>

          <label className="eventModal__check">
            <input type="checkbox" checked={hasVisio} onChange={(e) => setHasVisio(e.target.checked)} />
            <span>🔴 Diffuser en direct (visioconférence)</span>
          </label>

          {event && event.hasVisio && event.visioRoomName && (
            <div className="eventModal__visio">
              <VisioLauncher
                roomName={event.visioRoomName}
                title={event.title}
                variant="live"
                canCapture
                albumTarget={{ eventId: event._id }}
              />
            </div>
          )}
        </div>

        <footer className="eventModal__footer">
          <button className="eventModal__btn eventModal__btn--cancel" onClick={onClose}>Annuler</button>
          <button className="eventModal__btn eventModal__btn--save" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enregistrement…' : (event ? 'Enregistrer' : 'Créer')}
          </button>
        </footer>
      </div>
    </div>
  );
}
