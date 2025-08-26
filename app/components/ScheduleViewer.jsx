"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * Composant BEM ScheduleViewer
 * Affiche l'emploi du temps hebdomadaire d'une classe
 */
const ScheduleViewer = ({ 
  classeId, 
  isEditable = false, 
  compact = false,
  onEditSchedule = null 
}) => {
  const { user } = useUser()
  const [schedule, setSchedule] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const heures = [
    '08:00-09:00', '09:00-10:00', '10:00-10:15', '10:15-11:15', 
    '11:15-12:15', '12:15-13:30', '13:30-14:30', '14:30-15:30', 
    '15:30-15:45', '15:45-16:45'
  ]

  // Récupération de l'emploi du temps actif
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!classeId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Récupération de l'emploi du temps actif
        const scheduleResponse = await fetch(
          `/api/schedules?classeId=${classeId}&activeOnly=true`
        )
        const scheduleData = await scheduleResponse.json()

        if (scheduleData.success && scheduleData.data.length > 0) {
          setSchedule(scheduleData.data[0])
        } else {
          setSchedule(null)
        }

        // Récupération des matières
        const subjectsResponse = await fetch('/api/subjects')
        const subjectsData = await subjectsResponse.json()

        if (subjectsData.success) {
          setSubjects(subjectsData.data)
        }

      } catch (err) {
        console.error('Erreur lors du chargement de l\'emploi du temps:', err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [classeId])

  // Fonction pour obtenir les informations d'une matière
  const getSubjectInfo = (subjectId) => {
    return subjects.find(subject => subject._id === subjectId) || {
      nom: 'Matière inconnue',
      couleur: '#95a5a6'
    }
  }

  // Fonction pour obtenir les créneaux d'un jour et d'une heure
  const getTimeSlot = (jour, heureIndex) => {
    if (!schedule || !schedule.planning || !schedule.planning[jour]) {
      return null
    }

    const [heureDebut] = heures[heureIndex].split('-')
    return schedule.planning[jour].find(slot => 
      slot.heureDebut === heureDebut
    )
  }

  // Gestion du clic sur un créneau (mode édition)
  const handleSlotClick = (jour, heureIndex) => {
    if (!isEditable || !onEditSchedule) return

    const [heureDebut, heureFin] = heures[heureIndex].split('-')
    onEditSchedule({
      jour,
      heureDebut,
      heureFin,
      slot: getTimeSlot(jour, heureIndex)
    })
  }

  // Fonction pour déterminer si c'est une pause
  const isBreakTime = (heureIndex) => {
    return heures[heureIndex].includes('10:00-10:15') || 
           heures[heureIndex].includes('15:30-15:45') ||
           heures[heureIndex].includes('12:15-13:30')
  }

  // Rendu du composant de chargement
  if (loading) {
    return (
      <div className="scheduleViewer__container">
        <div className="scheduleViewer__loading">
          <div className="scheduleViewer__loading-spinner"></div>
        </div>
      </div>
    )
  }

  // Rendu en cas d'erreur
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

  // Rendu si aucun emploi du temps
  if (!schedule) {
    return (
      <div className="scheduleViewer__container">
        <div className="scheduleViewer__header">
          <div>
            <h3 className="scheduleViewer__header-title">Emploi du temps</h3>
            <p className="scheduleViewer__header-subtitle">Aucun emploi du temps défini</p>
          </div>
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
      {/* En-tête */}
      <div className="scheduleViewer__header">
        <div>
          <h3 className="scheduleViewer__header-title">{schedule.label}</h3>
          <p className="scheduleViewer__header-subtitle">
            Du {new Date(schedule.dateDebut).toLocaleDateString('fr-FR')} au {new Date(schedule.dateFin).toLocaleDateString('fr-FR')}
          </p>
        </div>
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
      </div>

      {/* Grille de l'emploi du temps */}
      <div className="scheduleViewer__grid">
        {/* Colonne des heures */}
        <div className="scheduleViewer__timeColumn">
          <div className="scheduleViewer__timeColumn-header">Heures</div>
          {heures.map((heure, index) => (
            <div key={index} className="scheduleViewer__timeColumn-slot">
              {heure}
            </div>
          ))}
        </div>

        {/* Colonnes des jours */}
        {jours.map(jour => (
          <div key={jour} className="scheduleViewer__dayColumn">
            <div className="scheduleViewer__dayColumn-header">
              {jour.charAt(0).toUpperCase() + jour.slice(1)}
            </div>
            {heures.map((heure, heureIndex) => {
              const slot = getTimeSlot(jour, heureIndex)
              const isBreak = isBreakTime(heureIndex)
              
              return (
                <div
                  key={`${jour}-${heureIndex}`}
                  className={`scheduleViewer__timeSlot ${
                    !slot ? 'scheduleViewer__timeSlot--empty' : ''
                  } ${isBreak ? 'scheduleViewer__timeSlot--break' : ''}`}
                  onClick={() => handleSlotClick(jour, heureIndex)}
                >
                  {slot ? (
                    <div 
                      className="scheduleViewer__subject"
                      style={{ backgroundColor: getSubjectInfo(slot.subjectId).couleur }}
                    >
                      <span className="scheduleViewer__subject-name">
                        {getSubjectInfo(slot.subjectId).nom}
                      </span>
                      <span className="scheduleViewer__subject-time">
                        {slot.heureDebut} - {slot.heureFin}
                      </span>
                      {slot.notes && (
                        <span className="scheduleViewer__subject-notes">
                          {slot.notes}
                        </span>
                      )}
                    </div>
                  ) : isBreak ? (
                    <div className="scheduleViewer__subject">
                      <span className="scheduleViewer__subject-name">Pause</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleViewer
