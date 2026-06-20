"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  validateEvents,
  planningToEvents,
  daysToDisplay,
  dayOfWeekToJour,
  timeToMinutes,
  minutesToTime,
  getCurrentTrimesterDates,
} from '../../utils/scheduleEvents'
import SubjectsPalette from './SubjectsPalette'

/**
 * ScheduleEditor — édition d'un emploi du temps au format `events[]`.
 *
 * Refonte : abandon de la grille à heures figées. On édite une liste d'événements
 * par jour (horaires libres), avec des cours et des pauses. La position visuelle
 * proportionnelle est gérée par le Viewer ; ici on privilégie une saisie fiable.
 */
const subjectIdOf = (subjectId) =>
  subjectId && typeof subjectId === 'object' ? (subjectId._id || subjectId.id || '') : (subjectId || '')

const ScheduleEditor = ({ classeId, schedule, onSave, onCancel }) => {
  const [subjects, setSubjects] = useState([])
  const [label, setLabel] = useState('')
  const [events, setEvents] = useState([])
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  // Identifiant client stable par événement : indispensable pour conserver le focus
  // des inputs quand les créneaux se réordonnent (tri par heure) en cours de saisie.
  const uidRef = useRef(0)
  const nextUid = () => (uidRef.current += 1)

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    if (schedule) {
      setLabel(schedule.label || '')
      const initial = Array.isArray(schedule.events) && schedule.events.length
        ? schedule.events
        : planningToEvents(schedule.planning)
      setEvents(initial.map((e) => ({ ...e, subjectId: subjectIdOf(e.subjectId), _uid: nextUid() })))
      setValidFrom(schedule.validFrom ? String(schedule.validFrom).slice(0, 10) : '')
      setValidUntil(schedule.validUntil ? String(schedule.validUntil).slice(0, 10) : '')
    } else {
      setLabel('')
      setEvents([])
      const { validFrom: vf, validUntil: vu } = getCurrentTrimesterDates()
      setValidFrom(vf)
      setValidUntil(vu)
    }
  }, [schedule])

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setSubjects(data.data)
      } else {
        const publicResponse = await fetch('/api/public/subjects', { credentials: 'include' })
        const publicData = await publicResponse.json()
        if (publicData.success && publicData.data) setSubjects(publicData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error)
    }
  }

  // Jours affichés : lun–ven + tout jour ayant déjà un événement.
  const days = daysToDisplay(events)

  const addEvent = (dayOfWeek, type) => {
    // Place le nouvel événement après le dernier du jour, sinon à 08:00.
    const dayEvents = events.filter((e) => e.dayOfWeek === dayOfWeek)
    const last = dayEvents.sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime))[0]
    const startTime = last ? last.endTime : '08:00'
    const startMin = timeToMinutes(startTime)
    const duration = type === 'BREAK' ? 15 : 60
    const endTime = minutesToTime(startMin + duration)
    
    setEvents((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        dayOfWeek,
        startTime,
        endTime,
        type,
        subjectId: type === 'COURSE' ? (subjects[0]?._id || '') : null,
        label: type === 'COURSE' ? '' : (type === 'BREAK' ? 'Pause' : 'Événement'),
        notes: '',
      },
    ])
  }

  const adjustEventDuration = (target, deltaMinutes) => {
    setEvents((prev) => prev.map((e) => {
      if (e !== target) return e;
      const startMin = timeToMinutes(e.startTime);
      const endMin = timeToMinutes(e.endTime);
      let newEndMin = endMin + deltaMinutes;
      if (newEndMin <= startMin) newEndMin = startMin + 5; // minimum 5 mins
      if (newEndMin > 24 * 60 - 1) newEndMin = 24 * 60 - 1;
      return { ...e, endTime: minutesToTime(newEndMin) };
    }));
  };

  const moveEvent = (dow, index, direction) => {
    setEvents((prev) => {
      const dayEvents = prev.filter(e => e.dayOfWeek === dow).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      if (index + direction < 0 || index + direction >= dayEvents.length) return prev;
      
      const target = dayEvents[index];
      const swapWith = dayEvents[index + direction];
      
      return prev.map(e => {
        if (e === target) {
          return { ...e, startTime: swapWith.startTime, endTime: swapWith.endTime };
        }
        if (e === swapWith) {
          return { ...e, startTime: target.startTime, endTime: target.endTime };
        }
        return e;
      });
    });
  };

  const updateEvent = (target, field, value) =>
    setEvents((prev) => prev.map((e) => (e === target ? { ...e, [field]: value } : e)))

  const removeEvent = (target) =>
    setEvents((prev) => prev.filter((e) => e !== target))

  const handleSave = async () => {
    try {
      setSaving(true)
      const validation = validateEvents(events)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }
      setValidationErrors([])

      // _id absent (création ou duplication) ⇒ POST ; sinon mise à jour.
      const isEdit = Boolean(schedule && schedule._id)
      const url = isEdit ? `/api/schedules/${schedule._id}` : '/api/schedules'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        classeId,
        label,
        events: events.map(({ _uid, ...e }) => e), // retire l'id client
        validFrom: validFrom || undefined,
        validUntil: validUntil || null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (data.success) {
        onSave()
      } else {
        if (Array.isArray(data.details)) setValidationErrors(data.details)
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const subjectColor = (id) => subjects.find((s) => s._id === id)?.couleur || '#95a5a6'

  return (
    <div className="scheduleEditor">
      <header className="scheduleEditor__header">
        <div className="scheduleEditor__header-content">
          <h2 className="scheduleEditor__title">
            {schedule?._id ? 'Modifier l\'emploi du temps' : 'Créer un emploi du temps'}
          </h2>

          <div className="scheduleEditor__form-group">
            <label className="scheduleEditor__label">Nom de l'emploi du temps</label>
            <input
              type="text"
              className="scheduleEditor__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Emploi du temps CM1 - Semestre 1"
            />
          </div>

          <div className="scheduleEditor__validity">
            <label className="scheduleEditor__form-group">
              <span className="scheduleEditor__label">Valable à partir du</span>
              <input type="date" className="scheduleEditor__input" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </label>
            <label className="scheduleEditor__form-group">
              <span className="scheduleEditor__label">Jusqu'au (optionnel)</span>
              <input type="date" className="scheduleEditor__input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="scheduleEditor__actions">
          <button className="scheduleEditor__btn scheduleEditor__btn--cancel" onClick={onCancel}>Annuler</button>
          <button className="scheduleEditor__btn scheduleEditor__btn--save" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </header>

      {validationErrors.length > 0 && (
        <div className="scheduleEditor__errors">
          <h3 className="scheduleEditor__errors-title">⚠️ Erreurs de validation</h3>
          <ul className="scheduleEditor__errors-list">
            {validationErrors.map((error, index) => (
              <li key={index} className="scheduleEditor__error">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="scheduleEditor__days">
        {days.map((dow) => {
          const jour = dayOfWeekToJour(dow)
          const dayEvents = events
            .filter((e) => e.dayOfWeek === dow)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
          return (
            <section key={dow} className="scheduleEditor__day">
              <h3 className="scheduleEditor__day-title">{jour.charAt(0).toUpperCase() + jour.slice(1)}</h3>

              <div className="scheduleEditor__day-events">
                {dayEvents.length === 0 && (
                  <p className="scheduleEditor__day-empty">Aucun créneau</p>
                )}
                {dayEvents.map((e, index) => (
                  <div
                    key={e._uid}
                    className={`scheduleEditor__row scheduleEditor__row--${e.type.toLowerCase()}`}
                  >
                    <div className="scheduleEditor__controls">
                      <button className="scheduleEditor__ctrl-btn" disabled={index === 0} onClick={() => moveEvent(dow, index, -1)}>↑</button>
                      <button className="scheduleEditor__ctrl-btn" disabled={index === dayEvents.length - 1} onClick={() => moveEvent(dow, index, 1)}>↓</button>
                    </div>
                    <input
                      type="time"
                      className="scheduleEditor__time"
                      value={e.startTime}
                      onChange={(ev) => updateEvent(e, 'startTime', ev.target.value)}
                    />
                    <span className="scheduleEditor__time-sep">→</span>
                    <input
                      type="time"
                      className="scheduleEditor__time"
                      value={e.endTime}
                      onChange={(ev) => updateEvent(e, 'endTime', ev.target.value)}
                    />
                    {e.type === 'BREAK' && (
                      <div className="scheduleEditor__break-controls">
                        <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, -5)} title="-5 min">-</button>
                        <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, 5)} title="+5 min">+</button>
                      </div>
                    )}

                    {e.type === 'COURSE' ? (
                      <>
                        <div className="scheduleEditor__course-controls" style={{ display: 'flex', gap: '4px', margin: '0 8px' }}>
                          <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, -15)} title="-15 min">-</button>
                          <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, 15)} title="+15 min">+</button>
                        </div>
                        <select
                          className="scheduleEditor__subject-select"
                          value={e.subjectId || ''}
                          onChange={(ev) => updateEvent(e, 'subjectId', ev.target.value)}
                          style={{ backgroundColor: subjectColor(e.subjectId) }}
                        >
                          <option value="">— Matière —</option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>{subject.nom}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <input
                        type="text"
                        className="scheduleEditor__label-input"
                        placeholder={e.type === 'BREAK' ? 'Pause' : 'Événement'}
                        value={e.label || ''}
                        onChange={(ev) => updateEvent(e, 'label', ev.target.value)}
                      />
                    )}

                    <input
                      type="text"
                      className="scheduleEditor__notes-input"
                      placeholder="Notes..."
                      value={e.notes || ''}
                      onChange={(ev) => updateEvent(e, 'notes', ev.target.value)}
                    />

                    <button className="scheduleEditor__remove-btn" onClick={() => removeEvent(e)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="scheduleEditor__day-add">
                <button className="scheduleEditor__add-btn" onClick={() => addEvent(dow, 'COURSE')}>+ Cours</button>
                <button className="scheduleEditor__add-btn scheduleEditor__add-btn--break" onClick={() => addEvent(dow, 'BREAK')}>+ Pause</button>
              </div>
            </section>
          )
        })}
      </div>

      <SubjectsPalette onSubjectsChange={(updatedSubjects) => setSubjects(updatedSubjects)} />
    </div>
  )
}

export default ScheduleEditor
