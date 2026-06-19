"use client"

import React, { useState, useEffect, useMemo } from 'react'
import PermissionGate from "./PermissionGate";
import {
  PIXELS_PER_MINUTE,
  timeToMinutes,
  minutesToTime,
  computeGridBounds,
  daysToDisplay,
  eventsByDay,
  dayOfWeekToJour,
} from '../../utils/scheduleEvents'
import { fetchEvents, typeMeta } from './events/eventsApi'

// Bornes de la semaine courante (lundi 00:00 → dimanche 23:59:59, heure locale).
function currentWeekRange() {
  const now = new Date()
  const offset = (now.getDay() + 6) % 7 // lundi = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59)
  return { from: monday, to: sunday }
}

// "HH:mm" local d'une date.
function localHHmm(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * ScheduleViewer — rendu "calendrier absolu" de l'emploi du temps d'une classe.
 *
 * Refonte (cf. schedule_refactoring_spec) :
 *  - plus d'heures/pauses codées en dur : la grille se calcule à partir des events
 *  - blocs positionnés en absolu, hauteur proportionnelle à la durée (1 min = N px)
 *  - plus d'appel /api/subjects : la matière est peuplée par le backend (events.subjectId)
 */
const ScheduleViewer = ({
  classeId,
  isEditable = false,
  compact = false,
  onEditSchedule = null,
  mergeEvents = false,
}) => {
  const [schedule, setSchedule] = useState(null)
  const [overlay, setOverlay] = useState([]) // événements de la semaine superposés
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!classeId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(`/api/schedules?classeId=${classeId}&activeOnly=true`, {
          credentials: 'include',
        })
        const data = await res.json()
        setSchedule(data.success && data.data.length > 0 ? data.data[0] : null)
      } catch (err) {
        console.error('Erreur lors du chargement de l\'emploi du temps:', err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [classeId])

  // Fusion dynamique : superpose les événements de la semaine sur la grille (spec).
  // Seuls les événements d'un seul jour avec une plage horaire sont positionnables.
  useEffect(() => {
    if (!mergeEvents || !classeId) { setOverlay([]); return }
    const loadWeekEvents = async () => {
      try {
        const { from, to } = currentWeekRange()
        const list = await fetchEvents({ classId: classeId, from: from.toISOString(), to: to.toISOString() })
        const mapped = []
        for (const ev of list) {
          const s = new Date(ev.startDate)
          const e = new Date(ev.endDate)
          if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) continue
          if (s.toDateString() !== e.toDateString()) continue // multi-jours → vu seulement dans l'agenda
          mapped.push({
            dayOfWeek: s.getDay(),
            startTime: localHHmm(s),
            endTime: localHHmm(e),
            title: ev.title,
            color: typeMeta(ev.type).color,
            isOverlay: true,
          })
        }
        setOverlay(mapped)
      } catch (_) {
        setOverlay([])
      }
    }
    loadWeekEvents()
  }, [mergeEvents, classeId])

  const events = useMemo(() => schedule?.events || [], [schedule])
  // Bornes/jours calculés en tenant compte des événements superposés.
  const combined = useMemo(() => [...events, ...overlay], [events, overlay])
  const { startMin, endMin } = useMemo(() => computeGridBounds(combined), [combined])
  const days = useMemo(() => daysToDisplay(combined), [combined])
  const byDay = useMemo(() => eventsByDay(events), [events])
  const overlayByDay = useMemo(() => eventsByDay(overlay), [overlay])

  const totalHeight = Math.max(0, (endMin - startMin) * PIXELS_PER_MINUTE)
  // Repères horaires (lignes pleines) de la borne basse à la borne haute.
  const hourMarks = []
  for (let m = startMin; m <= endMin; m += 60) hourMarks.push(m)

  const subjectInfo = (subjectId) => {
    if (subjectId && typeof subjectId === 'object') {
      return { nom: subjectId.nom || 'Matière', couleur: subjectId.couleur || '#3498db' }
    }
    // subjectId resté en chaîne brute = référence non peuplée (ref cassée / doc orphelin).
    // On garde l'id visible pour le diagnostic plutôt qu'un bloc gris muet.
    if (typeof subjectId === 'string' && subjectId) {
      return { nom: `Matière inconnue (${subjectId.slice(-6)})`, couleur: '#95a5a6' }
    }
    return { nom: 'Matière', couleur: '#95a5a6' }
  }

  const eventStyle = (e) => {
    const top = Math.max(0, (timeToMinutes(e.startTime) - startMin) * PIXELS_PER_MINUTE)
    const height = (timeToMinutes(e.endTime) - timeToMinutes(e.startTime)) * PIXELS_PER_MINUTE
    return { top: `${top}px`, height: `${Math.max(height, 18)}px` }
  }

  if (loading) {
    return (
      <div className="scheduleViewer__container">
        <div className="scheduleViewer__loading"><div className="scheduleViewer__loading-spinner"></div></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="scheduleViewer__container">
        <div className="scheduleViewer__empty">
          <div className="scheduleViewer__empty-icon">⚠️</div>
          <div className="scheduleViewer__empty-message">Erreur</div>
          <div className="scheduleViewer__empty-submessage">{error}</div>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="scheduleViewer__container">
        <div className="scheduleViewer__header">
          <div>
            <h3 className="scheduleViewer__header-title">Emploi du temps</h3>
            <p className="scheduleViewer__header-subtitle">Aucun emploi du temps défini</p>
          </div>
          <PermissionGate roles={['admin', 'prof']}>
            {isEditable && (
              <div className="scheduleViewer__actions">
                <button
                  className="scheduleViewer__actions-button scheduleViewer__actions-button--primary"
                  onClick={() => onEditSchedule && onEditSchedule({ action: 'create' })}
                >
                  Créer un emploi du temps
                </button>
              </div>
            )}
          </PermissionGate>
        </div>
        <div className="scheduleViewer__empty">
          <div className="scheduleViewer__empty-icon">📅</div>
          <div className="scheduleViewer__empty-message">Aucun emploi du temps</div>
          <div className="scheduleViewer__empty-submessage">
            {isEditable ? 'Cliquez sur "Créer un emploi du temps" pour commencer' : 'Contactez un administrateur'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`scheduleViewer__container ${compact ? 'scheduleViewer--compact' : ''} ${isEditable ? 'scheduleViewer--editable' : ''}`}>
      <div className="scheduleViewer__header">
        <div>
          <h3 className="scheduleViewer__header-title">{schedule.label}</h3>
        </div>
        <PermissionGate roles={['admin', 'prof']}>
          {isEditable && (
            <div className="scheduleViewer__actions">
              <button
                className="scheduleViewer__actions-button"
                onClick={() => onEditSchedule && onEditSchedule({ action: 'history', scheduleId: schedule._id })}
              >
                Historique
              </button>
              <button
                className="scheduleViewer__actions-button scheduleViewer__actions-button--primary"
                onClick={() => onEditSchedule && onEditSchedule({ action: 'edit', schedule })}
              >
                Modifier
              </button>
            </div>
          )}
        </PermissionGate>
      </div>

      {combined.length === 0 ? (
        <div className="scheduleViewer__empty">
          <div className="scheduleViewer__empty-icon">🗓️</div>
          <div className="scheduleViewer__empty-message">Emploi du temps vide</div>
        </div>
      ) : (
        <div className="scheduleViewer__calendar">
          {/* Axe des heures */}
          <div className="scheduleViewer__timeAxis" style={{ height: `${totalHeight}px` }}>
            {hourMarks.map((m) => (
              <div
                key={m}
                className="scheduleViewer__hourLabel"
                style={{ top: `${(m - startMin) * PIXELS_PER_MINUTE}px` }}
              >
                {minutesToTime(m)}
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          <div className="scheduleViewer__columns">
            {days.map((dow) => {
              const jour = dayOfWeekToJour(dow)
              return (
                <div key={dow} className="scheduleViewer__dayColumn">
                  <div className="scheduleViewer__dayColumn-header">
                    {jour.charAt(0).toUpperCase() + jour.slice(1)}
                  </div>
                  <div className="scheduleViewer__dayBody" style={{ height: `${totalHeight}px` }}>
                    {/* Lignes d'heures de fond */}
                    {hourMarks.map((m) => (
                      <div
                        key={m}
                        className="scheduleViewer__hourLine"
                        style={{ top: `${(m - startMin) * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}
                    {/* Événements */}
                    {(byDay.get(dow) || []).map((e, i) => {
                      const isBreak = e.type === 'BREAK'
                      const isCustom = e.type === 'CUSTOM_EVENT'
                      const info = subjectInfo(e.subjectId)
                      const bg = isBreak ? undefined : (isCustom ? '#7e57c2' : info.couleur)
                      return (
                        <div
                          key={i}
                          className={`scheduleViewer__event ${isBreak ? 'scheduleViewer__event--break' : ''} ${isCustom ? 'scheduleViewer__event--custom' : ''}`}
                          style={{ ...eventStyle(e), ...(bg ? { backgroundColor: bg } : {}) }}
                        >
                          <span className="scheduleViewer__event-name">
                            {isBreak || isCustom ? (e.label || (isBreak ? 'Pause' : 'Événement')) : info.nom}
                          </span>
                          <span className="scheduleViewer__event-time">{e.startTime} – {e.endTime}</span>
                          {e.notes && <span className="scheduleViewer__event-notes">{e.notes}</span>}
                        </div>
                      )
                    })}
                    {/* Événements de la semaine superposés (moitié droite) */}
                    {(overlayByDay.get(dow) || []).map((ev, i) => (
                      <div
                        key={`ov-${i}`}
                        className="scheduleViewer__event scheduleViewer__event--overlay"
                        style={{ ...eventStyle(ev), backgroundColor: ev.color }}
                        title={`${ev.title} (${ev.startTime}–${ev.endTime})`}
                      >
                        <span className="scheduleViewer__event-name">📅 {ev.title}</span>
                        <span className="scheduleViewer__event-time">{ev.startTime} – {ev.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleViewer
