"use client"

import React, { useState, useEffect } from 'react'
import { useUserRole } from '../../stores/useUserRole'
import '../../assets/scss/components/SCHEDULES/scheduleEditor.scss'
import { validatePlanning } from '../../utils/scheduleHelpers'

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
  const [isInitializingSubjects, setIsInitializingSubjects] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [breakTimes, setBreakTimes] = useState([])
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [subjectForm, setSubjectForm] = useState({
    nom: '',
    code: '',
    couleur: '#3498db',
    niveaux: false, // false = général, array = spécifique
    dureeDefaut: 60
  })
  const [isGeneralSubject, setIsGeneralSubject] = useState(true)
  

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

  // Gestion du modal des matières
  const openSubjectModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject)
      const isGeneral = subject.niveaux === false
      setIsGeneralSubject(isGeneral)
      setSubjectForm({
        nom: subject.nom,
        code: subject.code,
        couleur: subject.couleur,
        niveaux: isGeneral ? false : subject.niveaux,
        dureeDefaut: subject.dureeDefaut
      })
    } else {
      setEditingSubject(null)
      setIsGeneralSubject(true)
      setSubjectForm({
        nom: '',
        code: '',
        couleur: '#3498db',
        niveaux: false,
        dureeDefaut: 60
      })
    }
    setShowSubjectModal(true)
  }
  
  const closeSubjectModal = () => {
    setShowSubjectModal(false)
    setEditingSubject(null)
  }
  
  const handleGeneralChange = (isGeneral) => {
    setIsGeneralSubject(isGeneral)
    if (isGeneral) {
      setSubjectForm({
        ...subjectForm,
        niveaux: false
      })
    } else {
      setSubjectForm({
        ...subjectForm,
        niveaux: ['CP'] // Démarrer avec CP par défaut
      })
    }
  }
  
  const handleNiveauChange = (niveau, checked) => {
    if (isGeneralSubject) return // Pas de modification si général
    
    const currentNiveaux = Array.isArray(subjectForm.niveaux) ? subjectForm.niveaux : []
    
    if (checked) {
      setSubjectForm({
        ...subjectForm,
        niveaux: [...currentNiveaux, niveau]
      })
    } else {
      setSubjectForm({
        ...subjectForm,
        niveaux: currentNiveaux.filter(n => n !== niveau)
      })
    }
  }
  
  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingSubject 
        ? `/api/subjects/${editingSubject._id}`
        : '/api/subjects'
      const method = editingSubject ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(subjectForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Matière ${editingSubject ? 'modifiée' : 'créée'} avec succès`)
        await loadSubjects() // Recharger la liste
        closeSubjectModal()
      } else {
        console.error('❌ Erreur:', data.error)
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }
  
  const deleteSubject = async (subjectId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Matière supprimée avec succès')
        await loadSubjects() // Recharger la liste
      } else {
        console.error('❌ Erreur:', data.error)
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }
  
  // Fonction pour initialiser les matières par défaut
  const initializeDefaultSubjects = async () => {
    if (!isAdmin()) {
      alert('Seuls les administrateurs peuvent initialiser les matières par défaut')
      return
    }
    
    setIsInitializingSubjects(true)
    try {
      console.log('🚀 Initialisation des matières par défaut...')
      const response = await fetch('/api/init/subjects', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ ${data.message}`)
        alert(`✅ ${data.message}\n${data.count} matières créées avec succès !`)
        await loadSubjects() // Recharger la liste des matières
      } else {
        console.error('❌ Erreur:', data.error)
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error)
      alert('❌ Erreur lors de l\'initialisation des matières')
    } finally {
      setIsInitializingSubjects(false)
    }
  }

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
        )})}
      </div>

      {/* Palette des matières */}
      <div className="scheduleEditor__subjects-palette">
        <div className="scheduleEditor__subjects-header">
          <h3 className="scheduleEditor__subjects-title">Matières disponibles</h3>
          <div className="scheduleEditor__header-actions">
            {/* Bouton d'initialisation (admin uniquement, si aucune matière) */}
            {isAdmin() && subjects.length === 0 && (
              <button 
                className="scheduleEditor__init-subjects-btn"
                onClick={initializeDefaultSubjects}
                disabled={isInitializingSubjects}
                title="Générer les matières par défaut"
              >
                {isInitializingSubjects ? '⏳ Génération...' : '🎨 Générer matières'}
              </button>
            )}
            
            {/* Bouton d'ajout manuel (admin/prof) */}
            {(isAdmin() || isProf()) && (
              <button 
                className="scheduleEditor__add-subject-btn"
                onClick={() => openSubjectModal()}
                title="Ajouter une matière manuellement"
              >
                + Nouvelle matière
              </button>
            )}
          </div>
        </div>
        <div className="scheduleEditor__subjects-grid">
          {subjects.map(subject => (
            <div 
              key={subject._id}
              className="scheduleEditor__subject-chip"
              style={{ backgroundColor: subject.couleur }}
            >
              <div className="scheduleEditor__subject-info">
                <span className="scheduleEditor__subject-name">{subject.nom}</span>
                <span className="scheduleEditor__subject-duration">{subject.dureeDefaut}min</span>
              </div>
              {(isAdmin() || isProf()) && (
                <div className="scheduleEditor__subject-actions">
                  <button 
                    className="scheduleEditor__edit-subject-btn"
                    onClick={() => openSubjectModal(subject)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    className="scheduleEditor__delete-subject-btn"
                    onClick={() => deleteSubject(subject._id)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal de gestion des matières */}
      {showSubjectModal && (isAdmin() || isProf()) && (
        <div className="scheduleEditor__modal-overlay" onClick={() => closeSubjectModal()}>
          <div className="scheduleEditor__modal" onClick={(e) => e.stopPropagation()}>
            <div className="scheduleEditor__modal-header">
              <h3>{editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}</h3>
              <button 
                className="scheduleEditor__modal-close"
                onClick={() => closeSubjectModal()}
              >
                ✕
              </button>
            </div>
            <form className="scheduleEditor__subject-form" onSubmit={handleSubjectSubmit}>
              <div className="scheduleEditor__form-group">
                <label>Nom de la matière</label>
                <input 
                  type="text"
                  value={subjectForm.nom}
                  onChange={(e) => setSubjectForm({...subjectForm, nom: e.target.value})}
                  required
                />
              </div>
              <div className="scheduleEditor__form-group">
                <label>Code (max 6 caractères)</label>
                <input 
                  type="text"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value.toUpperCase()})}
                  maxLength="6"
                  required
                />
              </div>
              <div className="scheduleEditor__form-group">
                <label>Couleur</label>
                <input 
                  type="color"
                  value={subjectForm.couleur}
                  onChange={(e) => setSubjectForm({...subjectForm, couleur: e.target.value})}
                />
              </div>
              <div className="scheduleEditor__form-group">
                <label>Portée de la matière</label>
                <div className="scheduleEditor__radio-group">
                  <label className="scheduleEditor__radio-label">
                    <input 
                      type="radio"
                      name="subjectScope"
                      checked={isGeneralSubject}
                      onChange={() => handleGeneralChange(true)}
                    />
                    <span className="scheduleEditor__radio-text">
                      <strong>Générale</strong> - Disponible pour toutes les classes
                    </span>
                  </label>
                  <label className="scheduleEditor__radio-label">
                    <input 
                      type="radio"
                      name="subjectScope"
                      checked={!isGeneralSubject}
                      onChange={() => handleGeneralChange(false)}
                    />
                    <span className="scheduleEditor__radio-text">
                      <strong>Spécifique</strong> - Limitée à certaines classes
                    </span>
                  </label>
                </div>
                
                {!isGeneralSubject && (
                  <div className="scheduleEditor__specific-levels">
                    <label className="scheduleEditor__sublabel">Classes concernées</label>
                    <div className="scheduleEditor__checkbox-group">
                      {['CP', 'CE1', 'CE2', 'CM1', 'CM2'].map(niveau => (
                        <label key={niveau} className="scheduleEditor__checkbox-label">
                          <input 
                            type="checkbox"
                            checked={Array.isArray(subjectForm.niveaux) && subjectForm.niveaux.includes(niveau)}
                            onChange={(e) => handleNiveauChange(niveau, e.target.checked)}
                          />
                          {niveau}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="scheduleEditor__form-group">
                <label>Durée par défaut (minutes)</label>
                <input 
                  type="number"
                  value={subjectForm.dureeDefaut}
                  onChange={(e) => setSubjectForm({...subjectForm, dureeDefaut: parseInt(e.target.value)})}
                  min="15"
                  max="180"
                  step="15"
                  required
                />
              </div>
              <div className="scheduleEditor__form-actions">
                <button type="button" onClick={() => closeSubjectModal()}>
                  Annuler
                </button>
                <button type="submit">
                  {editingSubject ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleEditor
