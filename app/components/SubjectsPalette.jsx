"use client"

import React, { useState, useEffect } from 'react'
import { useUserRole } from '../../stores/useUserRole'
import { getLSItem } from '../../utils/localStorageManager'

/**
 * Composant SubjectsPalette
 * Gère l'affichage, la création, l'édition et la suppression des matières
 */
export default function SubjectsPalette({ onSubjectsChange }) {
    const { isAdmin, isProf } = useUserRole()

    const [subjects, setSubjects] = useState([])
    const [isInitializingSubjects, setIsInitializingSubjects] = useState(false)
    const [showSubjectModal, setShowSubjectModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState(null)

    const [subjectForm, setSubjectForm] = useState({
        nom: '',
        code: '',
        couleur: '#3498db',
        niveaux: false,
        dureeDefaut: 60
    })
    const [isGeneralSubject, setIsGeneralSubject] = useState(true)

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        try {
            console.log('🔄 [SubjectsPalette] Vérification de la disponibilité des matières locales...');
            const localStorageSubjects = getLSItem('app_subjects');
            if (localStorageSubjects && Array.isArray(localStorageSubjects) && localStorageSubjects.length > 0) {
                console.log('✅ [SubjectsPalette] Matières trouvées dans localStorage, arrêt du proxy API.');
                // Note that in SubjectsPalette, the original implementation fetched the full subject objects, 
                // but getLSItem('app_subjects') currently stores an array of strings (names) from EntityModal, 
                // so we need to fetch the real objects here if the local storage only has names.
                // For proper isolation, we will rely on fetching objects anyway if the exact full object array is not in cache,
                // but in this project they seem to use /api/subjects purely without caching the objects here. 
                // Let's implement the block:

                if (typeof localStorageSubjects[0] === 'object') {
                    setSubjects(localStorageSubjects);
                    if (onSubjectsChange) onSubjectsChange(localStorageSubjects);
                    return; // BLOCK FETCH
                }
            }

            console.log('🔄 [SubjectsPalette] Chargement des matières depuis API...')
            const response = await fetch('/api/subjects', { credentials: 'include' })
            const data = await response.json()

            if (data.success) {
                setSubjects(data.data)
                if (onSubjectsChange) onSubjectsChange(data.data)
            } else {
                const publicResponse = await fetch('/api/public/subjects', { credentials: 'include' })
                const publicData = await publicResponse.json()
                if (publicData.success && publicData.data) {
                    setSubjects(publicData.data)
                    if (onSubjectsChange) onSubjectsChange(publicData.data)
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des matières:', error)
        }
    }

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
            setSubjectForm({ ...subjectForm, niveaux: false })
        } else {
            setSubjectForm({ ...subjectForm, niveaux: ['CP'] })
        }
    }

    const handleNiveauChange = (niveau, checked) => {
        if (isGeneralSubject) return

        const currentNiveaux = Array.isArray(subjectForm.niveaux) ? subjectForm.niveaux : []
        if (checked) {
            setSubjectForm({ ...subjectForm, niveaux: [...currentNiveaux, niveau] })
        } else {
            setSubjectForm({ ...subjectForm, niveaux: currentNiveaux.filter(n => n !== niveau) })
        }
    }

    const handleSubjectSubmit = async (e) => {
        e.preventDefault()
        try {
            const subjectId = editingSubject ? (editingSubject._id || editingSubject.id) : null;
            const url = subjectId ? `/api/subjects/${subjectId}` : '/api/subjects'
            const method = subjectId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(subjectForm)
            })

            const data = await response.json()

            if (data.success) {
                await loadSubjects()
                closeSubjectModal()
            } else {
                alert(`Erreur: ${data.error}`)
            }
        } catch (error) {
            alert('Erreur lors de la sauvegarde')
        }
    }

    const deleteSubject = async (subjectIdStr) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return

        const actualId = subjectIdStr.id || subjectIdStr._id || subjectIdStr; // Sécurisation pour deleteSubject
        try {
            const response = await fetch(`/api/subjects/${actualId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                await loadSubjects()
            } else {
                alert(`Erreur: ${data.error}`)
            }
        } catch (error) {
            alert('Erreur lors de la suppression')
        }
    }

    const deleteAllSubjects = async () => {
        if (!isAdmin()) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer TOUTES les matières ? Cette action est irréversible.')) return

        try {
            const response = await fetch(`/api/subjects/delete-all`, {
                method: 'DELETE',
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                alert(`✅ ${data.message}`)
                await loadSubjects()
            } else {
                alert(`Erreur: ${data.error}`)
            }
        } catch (error) {
            alert('Erreur lors de la suppression de toutes les matières')
        }
    }

    const initializeDefaultSubjects = async () => {
        if (!isAdmin()) {
            alert('Seuls les administrateurs peuvent initialiser les matières par défaut')
            return
        }

        setIsInitializingSubjects(true)
        try {
            const response = await fetch('/api/init/subjects', { method: 'POST', credentials: 'include' })
            const data = await response.json()
            if (data.success) {
                alert(`✅ ${data.message}\n${data.count} matières créées avec succès !`)
                await loadSubjects()
            } else {
                alert(`❌ Erreur: ${data.error}`)
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'initialisation des matières')
        } finally {
            setIsInitializingSubjects(false)
        }
    }

    return (
        <>
            <div className="scheduleEditor__subjects-palette">
                <div className="scheduleEditor__subjects-header">
                    <h3 className="scheduleEditor__subjects-title">Matières disponibles</h3>
                    <div className="scheduleEditor__header-actions">
                        {/* Bouton pour tout supprimer (admin uniquement) */}
                        {isAdmin() && subjects.length > 0 && (
                            <button
                                className="scheduleEditor__delete-all-btn"
                                onClick={deleteAllSubjects}
                                title="Supprimer toutes les matières"
                                style={{ backgroundColor: '#e74c3c', color: 'white' }}
                            >
                                🗑️ Tout supprimer
                            </button>
                        )}

                        {isAdmin() && subjects.length === 0 && (
                            <button
                                className="scheduleEditor__init-subjects-btn"
                                onClick={initializeDefaultSubjects}
                                disabled={isInitializingSubjects}
                                title="Générer les matières par défaut"
                            >
                                {isInitializingSubjects ? '⏳ Génération...' : '🎨 Générer matières (16)'}
                            </button>
                        )}

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

            {showSubjectModal && (isAdmin() || isProf()) && (
                <div className="scheduleEditor__modal-overlay" onClick={() => closeSubjectModal()}>
                    <div className="scheduleEditor__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="scheduleEditor__modal-header">
                            <h3>{editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}</h3>
                            <button className="scheduleEditor__modal-close" onClick={() => closeSubjectModal()}>✕</button>
                        </div>
                        <form className="scheduleEditor__subject-form" onSubmit={handleSubjectSubmit}>
                            <div className="scheduleEditor__form-group">
                                <label>Nom de la matière</label>
                                <input
                                    type="text"
                                    value={subjectForm.nom}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="scheduleEditor__form-group">
                                <label>Code (max 6 caractères)</label>
                                <input
                                    type="text"
                                    value={subjectForm.code}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div className="scheduleEditor__form-group">
                                <label>Couleur</label>
                                <input
                                    type="color"
                                    value={subjectForm.couleur}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, couleur: e.target.value })}
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
                                        <span className="scheduleEditor__radio-text"><strong>Générale</strong> - Disponible pour toutes les classes</span>
                                    </label>
                                    <label className="scheduleEditor__radio-label">
                                        <input
                                            type="radio"
                                            name="subjectScope"
                                            checked={!isGeneralSubject}
                                            onChange={() => handleGeneralChange(false)}
                                        />
                                        <span className="scheduleEditor__radio-text"><strong>Spécifique</strong> - Limitée à certaines classes</span>
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
                                    onChange={(e) => setSubjectForm({ ...subjectForm, dureeDefaut: parseInt(e.target.value) })}
                                    min="15"
                                    max="180"
                                    step="15"
                                    required
                                />
                            </div>
                            <div className="scheduleEditor__form-actions">
                                <button type="button" onClick={() => closeSubjectModal()}>Annuler</button>
                                <button type="submit">{editingSubject ? 'Modifier' : 'Créer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
