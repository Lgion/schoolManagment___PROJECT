"use client"

import React, { useState, useEffect, useContext, useMemo } from 'react'
import { AiAdminContext } from '../../stores/ai_adminContext'
import ScheduleViewer from './ScheduleViewer'

/**
 * Détermine les 2 années scolaires courantes
 * En 2025, les 2 années scolaires courantes sont 2024-2025 et 2025-2026
 */
const getCurrentSchoolYears = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12
  
  let currentSchoolYear, nextSchoolYear
  
  // Si on est entre septembre et décembre, l'année scolaire commence cette année
  // Si on est entre janvier et août, l'année scolaire a commencé l'année précédente
  if (currentMonth >= 9) {
    currentSchoolYear = `${currentYear}-${currentYear + 1}`
    nextSchoolYear = `${currentYear + 1}-${currentYear + 2}`
  } else {
    currentSchoolYear = `${currentYear - 1}-${currentYear}`
    nextSchoolYear = `${currentYear}-${currentYear + 1}`
  }
  
  return [currentSchoolYear, nextSchoolYear]
}

/**
 * Filtre les classes pour ne garder que celles des 2 années courantes
 */
const filterCurrentYearClasses = (classes) => {
  if (!classes || !Array.isArray(classes)) return []
  
  const currentSchoolYears = getCurrentSchoolYears()
  
  return classes.filter(classe => {
    // Vérifie si l'année de la classe correspond aux années scolaires courantes
    return currentSchoolYears.includes(classe.annee)
  })
}

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
  
  // Filtrer les classes pour ne garder que celles de l'année courante (mémorisé)
  const currentYearClasses = useMemo(() => {
    return filterCurrentYearClasses(classes)
  }, [classes])

  useEffect(() => {
    fetchClasses && fetchClasses()
  }, [])

  useEffect(() => {
    if (currentYearClasses.length > 0) {
      loadScheduleStats()
    }
  }, [currentYearClasses])

  // Charge les statistiques des emplois du temps pour chaque classe
  const loadScheduleStats = async () => {
    if (!currentYearClasses || currentYearClasses.length === 0) return

    try {
      const stats = {}
      
      for (const classe of currentYearClasses) {
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
      {/* Aperçu de l'emploi du temps sélectionné */}
      {selectedClasseId && (
        <div className="scheduleManager__preview">
          <h2 className="scheduleManager__preview-title">
            Emploi du temps ACTIF de la classe - {currentYearClasses?.find(c => c._id === selectedClasseId)?.niveau} {currentYearClasses?.find(c => c._id === selectedClasseId)?.alias}
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

      <hr />
      <div className="scheduleManager__overview">
        <h2 className="scheduleManager__overview-title">Vue d'ensemble des classes de l'école et leur emplois du temps</h2>
        <div className="scheduleManager__overview-stats">
          <div className="scheduleManager__stat">
            <span className="scheduleManager__stat-value">{currentYearClasses?.length || 0}</span>
            <span className="scheduleManager__stat-label">Classes pour l'année courante</span>
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
        <h2 className="scheduleManager__classes-title">Classes ({getCurrentSchoolYears().join(' & ')})</h2>
        <div className="scheduleManager__classes-grid">
          {currentYearClasses?.map(classe => {
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
                    <span className="scheduleManager__class-stat-label">Archivé{stats.archived>1?"s":""}</span>
                  </div>
                  {/* <div className="scheduleManager__class-stat">
                    <span className="scheduleManager__class-stat-value">{stats.total}</span>
                    <span className="scheduleManager__class-stat-label">Total</span>
                  </div> */}
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
    </div>
  )
}

export default ScheduleManager
