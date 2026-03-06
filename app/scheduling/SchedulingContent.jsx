'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUserRole } from '../../stores/useUserRole'
import PermissionGate from '../components/PermissionGate'
import ScheduleManager from '../components/ScheduleManager'
import ScheduleHistory from '../components/ScheduleHistory'
import ScheduleEditor from '../components/ScheduleEditor'
import SubjectsPalette from '../components/SubjectsPalette'

export default function SchedulingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userRole, loading } = useUserRole()

  const [currentView, setCurrentView] = useState('manager')
  const [selectedClasseId, setSelectedClasseId] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedClasse, setSelectedClasse] = useState(null)

  // Récupération des paramètres URL
  useEffect(() => {
    const classeId = searchParams.get('classeId')
    const view = searchParams.get('view') || 'manager'

    if (classeId) {
      setSelectedClasseId(classeId)
    }

    setCurrentView(view)
  }, [searchParams])

  // Récupération des informations de la classe sélectionnée
  useEffect(() => {
    if (selectedClasseId) {
      fetchClasseInfo(selectedClasseId)
    } else {
      setSelectedClasse(null)
    }
  }, [selectedClasseId])

  // Fonction pour récupérer les informations de la classe
  const fetchClasseInfo = async (classeId) => {
    try {
      const response = await fetch(`/api/school_ai/classes`, {
        credentials: 'include'
      })

      if (response.ok) {
        const classes = await response.json()
        const classe = classes.find(c => c._id === classeId)

        if (classe) {
          setSelectedClasse(classe)
        } else {
          console.warn('Classe non trouvée:', classeId)
          setSelectedClasse(null)
        }
      } else {
        console.error('Erreur lors de la récupération des classes')
        setSelectedClasse(null)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de classe:', error)
      setSelectedClasse(null)
    }
  }

  // Gestion de la navigation
  const handleViewChange = (view, options = {}) => {
    setCurrentView(view)

    if (options.schedule) {
      setSelectedSchedule(options.schedule)
    }

    // Mise à jour de l'URL
    const params = new URLSearchParams(searchParams) // Conserver les params existants
    if (view !== 'manager') {
      params.set('view', view)
    } else {
      params.delete('view') // Nettoyer l'URL pour la vue par défaut
    }

    const newUrl = `/scheduling${params.toString() ? '?' + params.toString() : ''}`
    router.push(newUrl, { scroll: false })
  }

  // Gestion de la sélection de classe
  const handleClasseSelect = (classeId) => {
    setSelectedClasseId(classeId)
    const params = new URLSearchParams(searchParams)
    params.set('classeId', classeId)

    router.push(`/scheduling?${params.toString()}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="scheduling__loading">
        <div className="scheduling__loading-spinner"></div>
        <p>Chargement des permissions...</p>
      </div>
    )
  }

  return (
    <PermissionGate role="admin">
      <main className="scheduling">
        <header className="scheduling__header">
          <div className="scheduling__header-content">
            <h1 className="scheduling__title">
              📅 {selectedClasse
                ? `Emplois du Temps - ${selectedClasse.niveau} ${selectedClasse.alias} (${selectedClasse.annee})`
                : 'Gestion des Emplois du Temps'
              }
            </h1>
            <p className="scheduling__subtitle">
              {selectedClasse
                ? `Gérez les emplois du temps de la classe ${selectedClasse.niveau} ${selectedClasse.alias}`
                : 'Créez, modifiez et gérez les emplois du temps de vos classes'
              }
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
              Historique {selectedClasse?.niveau}-{selectedClasse?.alias}
            </button>
            <button
              className={`scheduling__nav-btn ${currentView === 'editor' ? 'scheduling__nav-btn--active' : ''}`}
              onClick={() => handleViewChange('editor')}
              disabled={!selectedClasseId}
            >
              <span className="scheduling__nav-btn-icon">✏️</span>
              Éditeur {selectedClasse?.niveau}-{selectedClasse?.alias}
            </button>
            <button
              className={`scheduling__nav-btn ${currentView === 'subjects' ? 'scheduling__nav-btn--active' : ''}`}
              onClick={() => handleViewChange('subjects')}
            >
              <span className="scheduling__nav-btn-icon">🎨</span>
              Matières
            </button>
          </nav>
        </header>

        <div className="scheduling__content">
          {currentView === 'manager' && (
            <>
              <ScheduleManager
                selectedClasseId={selectedClasseId}
                onClasseSelect={handleClasseSelect}
                onViewChange={handleViewChange}
              />
              <div className="scheduling__palette-wrapper">
                <SubjectsPalette />
              </div>
            </>
          )}

          {currentView === 'history' && selectedClasseId && (
            <>
              <ScheduleHistory
                classeId={selectedClasseId}
                onEditSchedule={(schedule) => handleViewChange('editor', { schedule })}
                onBackToManager={() => handleViewChange('manager')}
              />
              <div className="scheduling__palette-wrapper">
                <SubjectsPalette />
              </div>
            </>
          )}

          {currentView === 'editor' && selectedClasseId && (
            <ScheduleEditor
              classeId={selectedClasseId}
              schedule={selectedSchedule}
              onSave={() => handleViewChange('manager')}
              onCancel={() => handleViewChange('manager')}
            />
          )}

          {currentView === 'subjects' && (
            <div className="scheduling__subjects-view">
              <SubjectsPalette />
            </div>
          )}
        </div>
      </main>
    </PermissionGate>
  )
}
