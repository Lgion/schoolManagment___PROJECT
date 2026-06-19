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
}) => {
  const [schedule, setSchedule] = useState(null)
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

  const events = useMemo(() => schedule?.events || [], [schedule])
  const { startMin, endMin } = useMemo(() => computeGridBounds(events), [events])
  const days = useMemo(() => daysToDisplay(events), [events])
  const byDay = useMemo(() => eventsByDay(events), [events])

  const totalHeight = Math.max(0, (endMin - startMin) * PIXELS_PER_MINUTE)
  // Repères horaires (lignes pleines) de la borne basse à la borne haute.
  const hourMarks = []
  for (let m = startMin; m <= endMin; m += 60) hourMarks.push(m)

  const subjectInfo = (subjectId) => {
    if (subjectId && typeof subjectId === 'object') {
      return { nom: subjectId.nom || 'Matière', couleur: subjectId.couleur || '#3498db' }
    }
    return { nom: 'Matière', couleur: '#95a5a6' }
  }

  const eventStyle = (e) => {
    const top = (timeToMinutes(e.startTime) - startMin) * PIXELS_PER_MINUTE
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

      {events.length === 0 ? (
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
