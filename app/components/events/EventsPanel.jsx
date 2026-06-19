'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchEvents, deleteEvent, typeMeta, formatEventWhen } from './eventsApi';
import EventModal from './EventModal';

/**
 * Widget « Événements à venir » d'une classe : événements de la classe + événements
 * globaux de l'école. CRUD réservé aux profs/admins (`interactive`), lecture seule
 * pour élèves/parents. `canGlobal` autorise la création d'événements école (admin).
 */
export default function EventsPanel({ classId, interactive = false, canGlobal = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      setEvents(await fetchEvents({ classId }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (ev) => { setEditing(ev); setModalOpen(true); };

  const handleDelete = async (ev) => {
    if (!confirm(`Supprimer l'événement « ${ev.title} » ?`)) return;
    try {
      await deleteEvent(ev._id);
      setEvents((prev) => prev.filter((e) => e._id !== ev._id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="events">
      {interactive && (
        <div className="events__toolbar">
          <button className="events__add" onClick={openCreate}>+ Nouvel événement</button>
        </div>
      )}

      {error && <div className="events__error">{error}</div>}

      {loading ? (
        <p className="events__loading">Chargement…</p>
      ) : events.length === 0 ? (
        <p className="events__empty">Aucun événement à venir.</p>
      ) : (
        <ul className="events__list">
          {events.map((ev) => {
            const meta = typeMeta(ev.type);
            return (
              <li key={ev._id} className="events__item" style={{ '--event-color': meta.color }}>
                <span className="events__icon" title={meta.label}>{meta.icon}</span>
                <div className="events__info">
                  <span className="events__title">
                    {ev.title}
                    {ev.isGlobal && <span className="events__badge">École</span>}
                  </span>
                  <span className="events__when">{formatEventWhen(ev.startDate, ev.endDate)}</span>
                  {ev.location && <span className="events__location">📍 {ev.location}</span>}
                  {ev.description && <span className="events__desc">{ev.description}</span>}
                </div>
                {interactive && (
                  <div className="events__actions">
                    <button className="events__action" onClick={() => openEdit(ev)} aria-label="Modifier">✏️</button>
                    <button className="events__action" onClick={() => handleDelete(ev)} aria-label="Supprimer">🗑️</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {interactive && (
        <EventModal
          isOpen={modalOpen}
          event={editing}
          defaultClassId={classId}
          canGlobal={canGlobal}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
