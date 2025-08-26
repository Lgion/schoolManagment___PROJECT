"use client"

import React, { useState, useEffect, useContext } from 'react'
import { AiAdminContext } from '../../stores/ai_adminContext'
import ScheduleViewer from './ScheduleViewer'

/**
 * Composant ScheduleManager
 * Vue d'ensemble et sélection des classes pour la gestion des emplois du temps
 */
const ScheduleManager = ({ 
  selectedClasseId, 
  onClasseSelect, 
  onViewChange 
}) => {
  const { classes, fetchClasses } = useContext(AiAdminContext)
  const [scheduleStats, setScheduleStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses && fetchClasses()
    loadScheduleStats()
  }, [])

  // Charge les statistiques des emplois du temps pour chaque classe
  const loadScheduleStats = async () => {
    if (!classes || classes.length === 0) return

    try {
      const stats = {}
      
      for (const classe of classes) {
        const response = await fetch(`/api/schedules?classeId=${classe._id}&includeArchived=true`)
        const data = await response.json()
        
        if (data.success) {
          const schedules = data.data
          stats[classe._id] = {
            total: schedules.length,
            active: schedules.filter(s => !s.isArchived).length,
            archived: schedules.filter(s => s.isArchived).length
          }
        }
      }
      
      setScheduleStats(stats)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  // Récupère les statistiques d'une classe
  const getClasseStats = (classeId) => {
    return scheduleStats[classeId] || { total: 0, active: 0, archived: 0 }
  }

  // Gestion de la création d'un nouvel emploi du temps
  const handleCreateSchedule = (classeId) => {
    onClasseSelect(classeId)
    onViewChange('editor')
  }

  if (loading) {
    return (
      <div className="scheduleManager__loading">
        <div className="scheduleManager__loading-spinner"></div>
        <p>Chargement des classes...</p>
      </div>
    )
  }

  return (
    <div className="scheduleManager">
      <div className="scheduleManager__overview">
        <h2 className="scheduleManager__overview-title">Vue d'ensemble</h2>
        <div className="scheduleManager__overview-stats">
          <div className="scheduleManager__stat">
            <span className="scheduleManager__stat-value">{classes?.length || 0}</span>
            <span className="scheduleManager__stat-label">Classes</span>
          </div>
          <div className="scheduleManager__stat">
            <span className="scheduleManager__stat-value">
              {Object.values(scheduleStats).reduce((sum, stat) => sum + stat.active, 0)}
            </span>
            <span className="scheduleManager__stat-label">Emplois du temps actifs</span>
          </div>
          <div className="scheduleManager__stat">
            <span className="scheduleManager__stat-value">
              {Object.values(scheduleStats).reduce((sum, stat) => sum + stat.total, 0)}
            </span>
            <span className="scheduleManager__stat-label">Total emplois du temps</span>
          </div>
        </div>
      </div>

      <div className="scheduleManager__classes">
        <h2 className="scheduleManager__classes-title">Classes</h2>
        <div className="scheduleManager__classes-grid">
          {classes?.map(classe => {
            const stats = getClasseStats(classe._id)
            const isSelected = selectedClasseId === classe._id
            
            return (
              <div 
                key={classe._id}
                className={`scheduleManager__class-card ${isSelected ? 'scheduleManager__class-card--selected' : ''}`}
              >
                <div className="scheduleManager__class-card-header">
                  <h3 className="scheduleManager__class-card-title">
                    {classe.niveau} {classe.alias}
                  </h3>
                  <span className="scheduleManager__class-card-year">
                    {classe.annee}
                  </span>
                </div>

                <div className="scheduleManager__class-card-stats">
                  <div className="scheduleManager__class-stat">
                    <span className="scheduleManager__class-stat-value">{stats.active}</span>
                    <span className="scheduleManager__class-stat-label">Actif</span>
                  </div>
                  <div className="scheduleManager__class-stat">
                    <span className="scheduleManager__class-stat-value">{stats.archived}</span>
                    <span className="scheduleManager__class-stat-label">Archivé</span>
                  </div>
                  <div className="scheduleManager__class-stat">
                    <span className="scheduleManager__class-stat-value">{stats.total}</span>
                    <span className="scheduleManager__class-stat-label">Total</span>
                  </div>
                </div>

                <div className="scheduleManager__class-card-actions">
                  <button 
                    className="scheduleManager__class-btn scheduleManager__class-btn--view"
                    onClick={() => onClasseSelect(classe._id)}
                  >
                    <span className="scheduleManager__class-btn-icon">👁️</span>
                    Voir
                  </button>
                  <button 
                    className="scheduleManager__class-btn scheduleManager__class-btn--history"
                    onClick={() => {
                      onClasseSelect(classe._id)
                      onViewChange('history')
                    }}
                  >
                    <span className="scheduleManager__class-btn-icon">📚</span>
                    Historique
                  </button>
                  <button 
                    className="scheduleManager__class-btn scheduleManager__class-btn--create"
                    onClick={() => handleCreateSchedule(classe._id)}
                  >
                    <span className="scheduleManager__class-btn-icon">➕</span>
                    Créer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Aperçu de l'emploi du temps sélectionné */}
      {selectedClasseId && (
        <div className="scheduleManager__preview">
          <h2 className="scheduleManager__preview-title">
            Aperçu - {classes?.find(c => c._id === selectedClasseId)?.niveau} {classes?.find(c => c._id === selectedClasseId)?.alias}
          </h2>
          <ScheduleViewer 
            classeId={selectedClasseId}
            compact={true}
            isEditable={true}
            onEditSchedule={(data) => {
              if (data.action === 'create' || data.action === 'edit') {
                onViewChange('editor', { schedule: data.schedule })
              } else if (data.action === 'history') {
                onViewChange('history')
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ScheduleManager
