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

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const heures = [
    '08:00-09:00', '09:00-10:00', '10:00-10:30', '10:30-12:00', 
    '12:00-14:00', '14:00-15:00', '15:00-16:00'
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
          const activeSchedule = scheduleData.data[0]
          console.log('📅 Active schedule loaded:', activeSchedule)
          console.log('📋 Schedule planning structure:', activeSchedule.planning)
          
          // Log des subjectIds trouvés dans le planning
          const subjectIds = []
          Object.keys(activeSchedule.planning || {}).forEach(jour => {
            if (activeSchedule.planning[jour]) {
              activeSchedule.planning[jour].forEach(slot => {
                if (slot.subjectId) {
                  subjectIds.push(slot.subjectId)
                }
              })
            }
          })
          console.log('🔗 SubjectIds in schedule:', subjectIds)
          
          setSchedule(activeSchedule)
        } else {
          console.log('❌ No active schedule found for classe:', classeId)
          setSchedule(null)
        }

        // Récupération des matières
        const subjectsResponse = await fetch('/api/subjects', {
          credentials: 'include'
        })
        const subjectsData = await subjectsResponse.json()

        console.log('📚 Subjects API Response:', subjectsData)

        if (subjectsData.success && subjectsData.data) {
          setSubjects(subjectsData.data)
          console.log('✅ Subjects loaded:', subjectsData.data.length, 'matières')
        } else if (Array.isArray(subjectsData)) {
          // Fallback si la réponse est directement un array
          setSubjects(subjectsData)
          console.log('✅ Subjects loaded (direct array):', subjectsData.length, 'matières')
        } else {
          console.error('❌ Failed to load subjects:', subjectsData)
          setSubjects([])
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
    console.log('🔍 Looking for subject:', subjectId, 'Type:', typeof subjectId)
    
    // Si subjectId est déjà un objet peuplé (populated), le retourner directement
    if (typeof subjectId === 'object' && subjectId !== null && subjectId.nom) {
      console.log('✅ Subject already populated:', subjectId.nom)
      return {
        nom: subjectId.nom,
        couleur: subjectId.couleur || '#3498db',
        code: subjectId.code || '',
        ...subjectId
      }
    }
    
    // Sinon, chercher dans la liste des matières
    console.log('📋 Available subjects:', subjects.map(s => ({ id: s._id, nom: s.nom, type: typeof s._id })))
    
    // Essayer de trouver par _id (string ou ObjectId)
    let subject = subjects.find(s => s._id === subjectId)
    
    // Si pas trouvé, essayer avec toString() au cas où il y aurait un problème de type
    if (!subject && subjectId) {
      subject = subjects.find(s => s._id.toString() === subjectId.toString())
    }
    
    if (!subject) {
      console.warn('⚠️ Subject not found:', subjectId, 'Available IDs:', subjects.map(s => s._id))
      return {
        nom: `Matière inconnue (${subjectId})`,
        couleur: '#95a5a6'
      }
    }
    
    console.log('✅ Subject found:', subject.nom)
    return subject
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

  // Fonction pour déterminer si c'est une pause (seulement si le slot est vide)
  const isBreakTime = (heureIndex, hasSlot) => {
    // Ne marquer comme pause que si le créneau est vide ET correspond aux heures de pause
    if (hasSlot) return false
    
    return heures[heureIndex].includes('10:00-10:30') || 
           heures[heureIndex].includes('12:00-14:00')
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
              const isBreak = isBreakTime(heureIndex, !!slot)
              
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
                      <span className={`scheduleViewer__subject-name ${heure === '10:00-10:30' ? 'scheduleViewer__subject-name--break' : ''}`}>Pause {heure === '10:00-10:30' ? "goûté" :"midi"}</span>
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
