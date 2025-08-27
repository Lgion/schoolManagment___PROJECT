"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * Composant ScheduleHistory
 * Affiche l'historique des emplois du temps d'une classe
 */
const ScheduleHistory = ({ 
  classeId, 
  onEditSchedule, 
  onBackToManager 
}) => {
  const { user } = useUser()
  const [schedules, setSchedules] = useState([])
  const [classe, setClasse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(null)
  const [reactivating, setReactivating] = useState(null)

  useEffect(() => {
    loadScheduleHistory()
    loadClasseInfo()
  }, [classeId])

  const loadScheduleHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schedules?classeId=${classeId}&includeArchived=true`)
      const data = await response.json()

      if (data.success) {
        setSchedules(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClasseInfo = async () => {
    try {
      const response = await fetch(`/api/school_ai/classes`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const classes = await response.json()
        const classeInfo = classes.find(c => c._id === classeId)
        
        if (classeInfo) {
          setClasse(classeInfo)
        } else {
          console.warn('Classe non trouvée:', classeId)
        }
      } else {
        console.error('Erreur lors de la récupération des classes')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de classe:', error)
    }
  }

  const handleArchiveSchedule = async (scheduleId) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver cet emploi du temps ?')) {
      return
    }

    try {
      setArchiving(scheduleId)
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'archive' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'archivage')
      }

      await loadScheduleHistory() // Recharge la liste
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      alert('Erreur lors de l\'archivage de l\'emploi du temps')
    } finally {
      setArchiving(null)
    }
  }

  const handleReactivateSchedule = async (scheduleId) => {
    if (!confirm('Êtes-vous sûr de vouloir réactiver cet emploi du temps ?')) {
      return
    }

    try {
      setReactivating(scheduleId)
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'reactivate' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réactivation')
      }

      await loadScheduleHistory() // Recharge la liste
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error)
      alert('Erreur lors de la réactivation de l\'emploi du temps')
    } finally {
      setReactivating(null)
    }
  }

  const handleDuplicateSchedule = (schedule) => {
    // Crée une copie de l'emploi du temps pour édition
    const duplicatedSchedule = {
      ...schedule,
      _id: null, // Nouveau document
      label: `${schedule.label} (Copie)`,
      isArchived: false,
      modifications: []
    }
    
    onEditSchedule(duplicatedSchedule)
  }

  if (loading) {
    return (
      <div className="scheduleHistory__loading">
        <div className="scheduleHistory__loading-spinner"></div>
        <p>Chargement de l'historique...</p>
      </div>
    )
  }

  return (
    <div className="scheduleHistory">
      <header className="scheduleHistory__header">
        <button 
          className="scheduleHistory__back-btn"
          onClick={onBackToManager}
        >
          <span className="scheduleHistory__back-btn-icon">←</span>
          Retour au gestionnaire
        </button>
        <h2 className="scheduleHistory__title">
          Historique des emplois du temps{classe ? ` : classe de ${classe.niveau}${classe.alias ? `-${classe.alias} (${classe.annee})` : ''}` : ''}
        </h2>
        <p className="scheduleHistory__subtitle">
          {schedules.length} emploi{schedules.length > 1 ? 's' : ''} du temps trouvé{schedules.length > 1 ? 's' : ''}
          {classe && ` pour l'année ${classe.annee}`}
        </p>
      </header>

      <div className="scheduleHistory__filters">
        <div className="scheduleHistory__filter-group">
          <label className="scheduleHistory__filter-label">
            <input 
              type="checkbox" 
              className="scheduleHistory__filter-checkbox"
              defaultChecked={true}
            />
            Emplois du temps actifs
          </label>
          <label className="scheduleHistory__filter-label">
            <input 
              type="checkbox" 
              className="scheduleHistory__filter-checkbox"
              defaultChecked={true}
            />
            Emplois du temps archivés
          </label>
        </div>
      </div>

      <div className="scheduleHistory__timeline">
        {schedules.map((schedule, index) => (
          <div 
            key={schedule._id}
            className={`scheduleHistory__item ${schedule.isArchived ? 'scheduleHistory__item--archived' : 'scheduleHistory__item--active'}`}
          >
            <div className="scheduleHistory__item-marker">
              <span className="scheduleHistory__item-marker-icon">
                {schedule.isArchived ? '📦' : '📅'}
              </span>
            </div>

            <div className="scheduleHistory__item-content">
              <div className="scheduleHistory__item-header">
                <h3 className="scheduleHistory__item-title">{schedule.label}</h3>
                <div className="scheduleHistory__item-badges">
                  {!schedule.isArchived && (
                    <span className="scheduleHistory__badge scheduleHistory__badge--active">
                      Actif
                    </span>
                  )}
                  {schedule.isArchived && (
                    <span className="scheduleHistory__badge scheduleHistory__badge--archived">
                      Archivé
                    </span>
                  )}
                </div>
              </div>

              <div className="scheduleHistory__item-meta">
                <span className="scheduleHistory__item-created">
                  🕒 Créé le {new Date(schedule.createdAt).toLocaleDateString('fr-FR')}
                </span>
                {schedule.modifications.length > 0 && (
                  <span className="scheduleHistory__item-modifications">
                    ✏️ {schedule.modifications.length} modification{schedule.modifications.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="scheduleHistory__item-actions">
                <button 
                  className="scheduleHistory__item-btn scheduleHistory__item-btn--view"
                  onClick={() => onEditSchedule(schedule)}
                >
                  <span className="scheduleHistory__item-btn-icon">👁️</span>
                  Voir
                </button>
                
                {!schedule.isArchived && (
                  <button 
                    className="scheduleHistory__item-btn scheduleHistory__item-btn--edit"
                    onClick={() => onEditSchedule(schedule)}
                  >
                    <span className="scheduleHistory__item-btn-icon">✏️</span>
                    Modifier
                  </button>
                )}
                
                <button 
                  className="scheduleHistory__item-btn scheduleHistory__item-btn--duplicate"
                  onClick={() => handleDuplicateSchedule(schedule)}
                >
                  <span className="scheduleHistory__item-btn-icon">📋</span>
                  Dupliquer
                </button>
                
                {!schedule.isArchived ? (
                  <button 
                    className="scheduleHistory__item-btn scheduleHistory__item-btn--archive"
                    onClick={() => handleArchiveSchedule(schedule._id)}
                    disabled={archiving === schedule._id}
                  >
                    <span className="scheduleHistory__item-btn-icon">
                      {archiving === schedule._id ? '⏳' : '📦'}
                    </span>
                    {archiving === schedule._id ? 'Archivage...' : 'Archiver'}
                  </button>
                ) : (
                  <button 
                    className="scheduleHistory__item-btn scheduleHistory__item-btn--reactivate"
                    onClick={() => handleReactivateSchedule(schedule._id)}
                    disabled={reactivating === schedule._id}
                  >
                    <span className="scheduleHistory__item-btn-icon">
                      {reactivating === schedule._id ? '⏳' : '🔄'}
                    </span>
                    {reactivating === schedule._id ? 'Réactivation...' : 'Réactiver'}
                  </button>
                )}
              </div>

              {/* Détails des modifications */}
              {schedule.modifications.length > 0 && (
                <details className="scheduleHistory__item-details">
                  <summary className="scheduleHistory__item-details-summary">
                    Voir l'historique des modifications
                  </summary>
                  <div className="scheduleHistory__modifications">
                    {schedule.modifications.map((mod, modIndex) => (
                      <div key={modIndex} className="scheduleHistory__modification">
                        <span className="scheduleHistory__modification-date">
                          {new Date(mod.date).toLocaleDateString('fr-FR')} à {new Date(mod.date).toLocaleTimeString('fr-FR')}
                        </span>
                        <span className="scheduleHistory__modification-action">
                          {mod.action === 'created' && '✨ Créé'}
                          {mod.action === 'updated' && '✏️ Modifié'}
                          {mod.action === 'archived' && '📦 Archivé'}
                          {mod.action === 'reactivated' && '🔄 Réactivé'}
                        </span>
                        <span className="scheduleHistory__modification-user">
                          par {mod.userId}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="scheduleHistory__empty">
          <div className="scheduleHistory__empty-icon">📅</div>
          <h3 className="scheduleHistory__empty-title">Aucun emploi du temps</h3>
          <p className="scheduleHistory__empty-message">
            Cette classe n'a pas encore d'emploi du temps.
          </p>
          <button 
            className="scheduleHistory__empty-btn"
            onClick={() => onEditSchedule(null)}
          >
            Créer le premier emploi du temps
          </button>
        </div>
      )}
    </div>
  )
}

export default ScheduleHistory
