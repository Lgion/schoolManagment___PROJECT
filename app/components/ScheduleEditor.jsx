"use client"

import React, { useState, useEffect } from 'react'
import { useUserRole } from '../../stores/useUserRole'
import { validatePlanning } from '../../utils/scheduleHelpers'
import SubjectsPalette from './SubjectsPalette'

/**
 * Composant ScheduleEditor
 * Éditeur d'emploi du temps avec interface drag & drop
 */
const ScheduleEditor = ({
  classeId,
  schedule,
  onSave,
  onCancel
}) => {
  // Récupération du rôle utilisateur pour les permissions
  const { isAdmin, isProf } = useUserRole()
  const [subjects, setSubjects] = useState([])
  const [breakTimes, setBreakTimes] = useState([])


  const [currentSchedule, setCurrentSchedule] = useState(null)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const heures = [
    { debut: '08:00', fin: '09:00' },
    { debut: '09:00', fin: '10:00' },
    { debut: '10:00', fin: '10:15' }, // Pause
    { debut: '10:15', fin: '11:15' },
    { debut: '11:15', fin: '12:15' },
    { debut: '12:15', fin: '13:30' }, // Pause déjeuner
    { debut: '13:30', fin: '14:30' },
    { debut: '14:30', fin: '15:30' },
    { debut: '15:30', fin: '15:45' }, // Pause
    { debut: '15:45', fin: '16:45' }
  ]

  useEffect(() => {
    loadSubjects()
    loadBreakTimes()
    initializeSchedule()
  }, [schedule])

  // Chargement des matières
  const loadSubjects = async () => {
    try {
      console.log('🔄 Chargement des matières...')
      const response = await fetch('/api/subjects', {
        credentials: 'include' // Inclure les cookies d'authentification
      })
      console.log('📡 Réponse API subjects:', response.status)

      const data = await response.json()
      console.log('📊 Données reçues:', data)

      if (data.success) {
        console.log('✅ Matières chargées:', data.data.length)
        setSubjects(data.data)
      } else {
        console.error('❌ Erreur API:', data.error)
        // Fallback: essayer l'API publique
        console.log('🔄 Tentative avec API publique...')
        const publicResponse = await fetch('/api/public/subjects', {
          credentials: 'include'
        })
        const publicData = await publicResponse.json()
        if (publicData.success && publicData.data) {
          console.log('✅ Matières chargées via API publique:', publicData.data.length)
          setSubjects(publicData.data)
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des matières:', error)
    }
  }

  // Chargement des pauses
  const loadBreakTimes = async () => {
    try {
      const response = await fetch('/api/breaktimes', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setBreakTimes(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pauses:', error)
    }
  }

  const initializeSchedule = () => {
    if (schedule) {
      // Mode édition
      setCurrentSchedule({
        ...schedule,
        planning: schedule.planning || createEmptyPlanning()
      })
    } else {
      // Mode création
      setCurrentSchedule({
        classeId,
        label: '',
        planning: createEmptyPlanning(),
      })
    }
  }

  const createEmptyPlanning = () => {
    const planning = {}
    jours.forEach(jour => {
      planning[jour] = []
    })
    return planning
  }

  const handleAddTimeSlot = (jour, heureIndex) => {
    const heure = heures[heureIndex]
    const newSlot = {
      heureDebut: heure.debut,
      heureFin: heure.fin,
      subjectId: subjects[0]?._id || '',
      notes: ''
    }

    setCurrentSchedule(prev => ({
      ...prev,
      planning: {
        ...prev.planning,
        [jour]: [...(prev.planning[jour] || []), newSlot]
      }
    }))
  }

  const handleRemoveTimeSlot = (jour, slotIndex) => {
    setCurrentSchedule(prev => ({
      ...prev,
      planning: {
        ...prev.planning,
        [jour]: prev.planning[jour].filter((_, index) => index !== slotIndex)
      }
    }))
  }

  const handleUpdateTimeSlot = (jour, slotIndex, field, value) => {
    setCurrentSchedule(prev => ({
      ...prev,
      planning: {
        ...prev.planning,
        [jour]: prev.planning[jour].map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validation
      const validation = validatePlanning(currentSchedule.planning)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }

      setValidationErrors([])

      const url = schedule ? `/api/schedules/${schedule._id}` : '/api/schedules'
      const method = schedule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // IMPORTANT: Inclure les cookies d'authentification
        body: JSON.stringify(currentSchedule)
      })

      const data = await response.json()

      if (data.success) {
        alert(schedule ? 'Emploi du temps modifié avec succès !' : 'Emploi du temps créé avec succès !')
        onSave()
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde de l\'emploi du temps')
    } finally {
      setSaving(false)
    }
  }

  const getSubjectInfo = (subjectId) => {
    return subjects.find(s => s._id === subjectId) || { nom: 'Matière inconnue', couleur: '#95a5a6' }
  }

  // Vérifier si un créneau horaire est une pause (basé sur MongoDB)
  const isBreakTime = (heure) => {
    if (!breakTimes || breakTimes.length === 0) return false

    return breakTimes.some(breakTime => {
      return breakTime.isActive && breakTime.isInTimeRange && breakTime.isInTimeRange(heure.debut)
    })
  }

  // Obtenir les informations de la pause pour un créneau
  const getBreakInfo = (heure) => {
    if (!breakTimes || breakTimes.length === 0) return null

    return breakTimes.find(breakTime => {
      return breakTime.isActive &&
        heure.debut >= breakTime.heureDebut &&
        heure.debut < breakTime.heureFin
    })
  }

  // Les fonctions de gestion des matières ont été extraites dans SubjectsPalette.jsx


  if (!currentSchedule) {
    return <div className="scheduleEditor__loading">Chargement...</div>
  }

  return (
    <div className="scheduleEditor">
      <header className="scheduleEditor__header">
        <div className="scheduleEditor__header-content">
          <h2 className="scheduleEditor__title">
            {schedule ? 'Modifier l\'emploi du temps' : 'Créer un emploi du temps'}
          </h2>

          <div className="scheduleEditor__form-group">
            <label className="scheduleEditor__label">
              Nom de l'emploi du temps
            </label>
            <input
              type="text"
              className="scheduleEditor__input"
              value={currentSchedule.label}
              onChange={(e) => setCurrentSchedule(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Emploi du temps CM1 - Semestre 1"
            />
          </div>
        </div>

        <div className="scheduleEditor__actions">
          <button
            className="scheduleEditor__btn scheduleEditor__btn--cancel"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="scheduleEditor__btn scheduleEditor__btn--save"
            onClick={handleSave}
            disabled={saving}
          >
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

      <div className="scheduleEditor__grid">
        {/* En-tête des heures */}
        <div className="scheduleEditor__time-header">Heures</div>
        {jours.map(jour => (
          <div key={jour} className="scheduleEditor__day-header">
            {jour.charAt(0).toUpperCase() + jour.slice(1)}
          </div>
        ))}

        {/* Grille des créneaux */}
        {heures.map((heure, heureIndex) => {
          const breakInfo = getBreakInfo(heure)
          const isBreak = isBreakTime(heure)

          return (
            <React.Fragment key={heureIndex}>
              <div className={`scheduleEditor__time-slot ${isBreak ? 'scheduleEditor__time-slot--break' : ''}`}>
                {heure.debut} - {heure.fin}
                {isBreak && breakInfo && (
                  <span className="scheduleEditor__break-label">{breakInfo.nom}</span>
                )}
              </div>

              {jours.map(jour => {
                const daySlots = currentSchedule.planning[jour] || []
                const slot = daySlots.find(s => s.heureDebut === heure.debut)

                return (
                  <div
                    key={`${jour}-${heureIndex}`}
                    className={`scheduleEditor__cell ${isBreak ? 'scheduleEditor__cell--break' : ''}`}
                  >
                    {slot ? (
                      <div className="scheduleEditor__slot">
                        <select
                          className="scheduleEditor__subject-select"
                          value={slot.subjectId}
                          onChange={(e) => handleUpdateTimeSlot(jour, daySlots.indexOf(slot), 'subjectId', e.target.value)}
                          style={{ backgroundColor: getSubjectInfo(slot.subjectId).couleur }}
                        >
                          {subjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                              {subject.nom}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          className="scheduleEditor__notes-input"
                          placeholder="Notes..."
                          value={slot.notes || ''}
                          onChange={(e) => handleUpdateTimeSlot(jour, daySlots.indexOf(slot), 'notes', e.target.value)}
                        />

                        <button
                          className="scheduleEditor__remove-btn"
                          onClick={() => handleRemoveTimeSlot(jour, daySlots.indexOf(slot))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : !isBreak ? (
                      <button
                        className="scheduleEditor__add-btn"
                        onClick={() => handleAddTimeSlot(jour, heureIndex)}
                      >
                        + Ajouter
                      </button>
                    ) : (
                      <div
                        className="scheduleEditor__break"
                        style={{ backgroundColor: breakInfo?.couleur || '#ffa726' }}
                      >
                        {breakInfo?.nom || 'Pause'}
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>

      {/* Palette des matières */}
      <SubjectsPalette onSubjectsChange={(updatedSubjects) => {
        // Optionnel : ne mettre à jour que si les matières changent pour éviter trop de re-renders
        // ou pour permettre à l'éditeur de toujours avoir accès aux matières à jour
        setSubjects(updatedSubjects);
      }} />

    </div>
  )
}

export default ScheduleEditor
