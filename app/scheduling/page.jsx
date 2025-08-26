"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUserRole } from '../../stores/useUserRole'
import PermissionGate from '../components/PermissionGate'
import ScheduleManager from '../components/ScheduleManager'
import ScheduleHistory from '../components/ScheduleHistory'
import ScheduleEditor from '../components/ScheduleEditor'

/**
 * Page de gestion des emplois du temps
 * /scheduling?classeId=xxx&view=history
 */
export default function SchedulingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userRole, loading } = useUserRole()
  
  const [currentView, setCurrentView] = useState('manager')
  const [selectedClasseId, setSelectedClasseId] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  // Récupération des paramètres URL
  useEffect(() => {
    const classeId = searchParams.get('classeId')
    const view = searchParams.get('view') || 'manager'
    
    if (classeId) {
      setSelectedClasseId(classeId)
    }
    
    setCurrentView(view)
  }, [searchParams])

  // Gestion de la navigation
  const handleViewChange = (view, options = {}) => {
    setCurrentView(view)
    
    if (options.schedule) {
      setSelectedSchedule(options.schedule)
    }
    
    // Mise à jour de l'URL
    const params = new URLSearchParams()
    if (selectedClasseId) params.set('classeId', selectedClasseId)
    if (view !== 'manager') params.set('view', view)
    
    const newUrl = `/scheduling${params.toString() ? '?' + params.toString() : ''}`
    router.push(newUrl, { scroll: false })
  }

  // Gestion de la sélection de classe
  const handleClasseSelect = (classeId) => {
    setSelectedClasseId(classeId)
    const params = new URLSearchParams()
    params.set('classeId', classeId)
    if (currentView !== 'manager') params.set('view', currentView)
    
    router.push(`/scheduling?${params.toString()}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="scheduling__loading">
        <div className="scheduling__loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <PermissionGate role="admin">
      <main className="scheduling">
        <header className="scheduling__header">
          <div className="scheduling__header-content">
            <h1 className="scheduling__title">
              📅 Gestion des Emplois du Temps
            </h1>
            <p className="scheduling__subtitle">
              Créez, modifiez et gérez les emplois du temps de vos classes
            </p>
          </div>
          
          <nav className="scheduling__nav">
            <button 
              className={`scheduling__nav-btn ${currentView === 'manager' ? 'scheduling__nav-btn--active' : ''}`}
              onClick={() => handleViewChange('manager')}
            >
              <span className="scheduling__nav-btn-icon">🏠</span>
              Gestionnaire
            </button>
            <button 
              className={`scheduling__nav-btn ${currentView === 'history' ? 'scheduling__nav-btn--active' : ''}`}
              onClick={() => handleViewChange('history')}
              disabled={!selectedClasseId}
            >
              <span className="scheduling__nav-btn-icon">📚</span>
              Historique
            </button>
            <button 
              className={`scheduling__nav-btn ${currentView === 'editor' ? 'scheduling__nav-btn--active' : ''}`}
              onClick={() => handleViewChange('editor')}
              disabled={!selectedClasseId}
            >
              <span className="scheduling__nav-btn-icon">✏️</span>
              Éditeur
            </button>
          </nav>
        </header>

        <div className="scheduling__content">
          {currentView === 'manager' && (
            <ScheduleManager 
              selectedClasseId={selectedClasseId}
              onClasseSelect={handleClasseSelect}
              onViewChange={handleViewChange}
            />
          )}
          
          {currentView === 'history' && selectedClasseId && (
            <ScheduleHistory 
              classeId={selectedClasseId}
              onEditSchedule={(schedule) => handleViewChange('editor', { schedule })}
              onBackToManager={() => handleViewChange('manager')}
            />
          )}
          
          {currentView === 'editor' && selectedClasseId && (
            <ScheduleEditor 
              classeId={selectedClasseId}
              schedule={selectedSchedule}
              onSave={() => handleViewChange('manager')}
              onCancel={() => handleViewChange('manager')}
            />
          )}
        </div>
      </main>
    </PermissionGate>
  )
}
