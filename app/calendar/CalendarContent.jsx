'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useUserRole } from '../../stores/useUserRole';
import PermissionGate from '../components/PermissionGate';
import EventModal from '../components/events/EventModal';
import { fetchEvents, typeMeta, formatEventWhen, dayKeyLocal } from '../components/events/eventsApi';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// 42 jours (6 semaines) couvrant le mois, en commençant un lundi.
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

// L'événement couvre-t-il ce jour (local) ?
function coversDay(ev, date) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 86399999;
  return new Date(ev.startDate).getTime() <= dayEnd && new Date(ev.endDate).getTime() >= dayStart;
}

export default function CalendarContent({ embedded = false }) {
  const { userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const grid = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor]);

  const load = useCallback(async () => {
    setError('');
    try {
      const from = grid[0].toISOString();
      const to = new Date(grid[41].getFullYear(), grid[41].getMonth(), grid[41].getDate(), 23, 59, 59).toISOString();
      setEvents(await fetchEvents({ from, to }));
    } catch (e) {
      setError(e.message);
    }
  }, [grid]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => setCursor(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  const nextMonth = () => setCursor(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  const goToday = () => setCursor({ year: today.getFullYear(), month: today.getMonth() });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEvent = (ev) => { if (isAdmin) { setEditing(ev); setModalOpen(true); } };

  const todayKey = dayKeyLocal(today);

  return (
    <div className="calendar">
      <header className="calendar__header">
        <div>
          {!embedded && <Link href="/classes" className="calendar__back">⬅️ Retour aux classes</Link>}
          <h1 className="calendar__title">📅 Agenda de l'école</h1>
        </div>
        <div className="calendar__nav">
          <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Mois précédent">‹</button>
          <button className="calendar__today-btn" onClick={goToday}>Aujourd'hui</button>
          <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Mois suivant">›</button>
          <span className="calendar__month">{MONTHS[cursor.month]} {cursor.year}</span>
          <PermissionGate role="admin">
            <button className="calendar__add" onClick={openCreate}>+ Nouvel événement</button>
          </PermissionGate>
        </div>
      </header>

      {error && <div className="calendar__error">{error}</div>}

      <div className="calendar__grid">
        {WEEKDAYS.map((d) => <div key={d} className="calendar__weekday">{d}</div>)}

        {grid.map((date) => {
          const inMonth = date.getMonth() === cursor.month;
          const dayEvents = events.filter((ev) => coversDay(ev, date));
          const key = dayKeyLocal(date);
          return (
            <div key={key} className={`calendar__cell ${inMonth ? '' : 'calendar__cell--out'} ${key === todayKey ? 'calendar__cell--today' : ''}`}>
              <span className="calendar__cell-num">{date.getDate()}</span>
              <div className="calendar__cell-events">
                {dayEvents.map((ev) => {
                  const meta = typeMeta(ev.type);
                  return (
                    <button
                      key={ev._id}
                      className="calendar__chip"
                      style={{ '--event-color': meta.color }}
                      title={`${meta.label} — ${formatEventWhen(ev.startDate, ev.endDate)}${ev.location ? ' — ' + ev.location : ''}`}
                      onClick={() => openEvent(ev)}
                    >
                      <span className="calendar__chip-icon">{meta.icon}</span>
                      <span className="calendar__chip-title">{ev.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        isOpen={modalOpen}
        event={editing}
        defaultClassId={null}
        canGlobal={true}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
