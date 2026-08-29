"use client"

import React, { useState, useEffect } from 'react'

export default function GroupCreateModal({ isOpen, onClose, currentUserId, onSuccess }) {
  const [step, setStep] = useState(1)
  
  // Étape 1 : Infos Générales
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [features, setFeatures] = useState({
    chat: true,
    wall: true,
    fileSharing: true
  })

  // Étape 2 : Sélection des Membres
  const [searchQuery, setSearchQuery] = useState('')
  const [memberTypeFilter, setMemberTypeFilter] = useState('all') // all, teacher, student
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])

  // Étape 3 : Rôles et Privilèges
  const [memberRoles, setMemberRoles] = useState({}) // userId -> 'ADMIN' or 'MEMBER'
  const [submitting, setSubmitting] = useState(false)

  // Charger les utilisateurs (élèves et enseignants) à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      // Reset state
      setStep(1)
      setName('')
      setDescription('')
      setIsPrivate(true)
      setFeatures({ chat: true, wall: true, fileSharing: true })
      setSelectedUserIds([])
      setMemberRoles({})
      setSearchQuery('')
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const [elevesRes, enseignantsRes] = await Promise.all([
        fetch('/api/school_ai/eleves'),
        fetch('/api/school_ai/enseignants')
      ])
      
      let students = []
      let teachers = []

      if (elevesRes.ok) {
        students = await elevesRes.json()
      }
      if (enseignantsRes.ok) {
        teachers = await enseignantsRes.json()
      }

      // Mapper les utilisateurs dans un format commun
      const mappedStudents = students.map(s => ({
        id: s.clerkId || s._id,
        dbId: s._id,
        name: `${s.nom} ${Array.isArray(s.prenoms) ? s.prenoms.join(' ') : (s.prenoms || '')}`.trim(),
        type: 'STUDENT',
        photo: s.photo || '/school/student.webp',
        details: s.current_classe ? 'Élève' : 'Élève (Sans classe)'
      }))

      const mappedTeachers = teachers.map(t => ({
        id: t.clerkId || t._id,
        dbId: t._id,
        name: `${t.nom} ${Array.isArray(t.prenoms) ? t.prenoms.join(' ') : (t.prenoms || '')}`.trim(),
        type: 'TEACHER',
        photo: t.photo || '/school/prof.webp',
        details: 'Enseignant'
      }))

      // Combiner et exclure l'utilisateur actuel
      const all = [...mappedTeachers, ...mappedStudents].filter(u => u.id !== currentUserId)
      setAvailableUsers(all)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Filtrer les utilisateurs affichés
  const filteredUsers = availableUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = memberTypeFilter === 'all' || 
      (memberTypeFilter === 'teacher' && u.type === 'TEACHER') || 
      (memberTypeFilter === 'student' && u.type === 'STUDENT')
    return matchesSearch && matchesType
  })

  const handleToggleSelectUser = (id) => {
    setSelectedUserIds(prev => {
      const isSelected = prev.includes(id)
      const nextList = isSelected ? prev.filter(x => x !== id) : [...prev, id]
      
      // Mettre à jour par défaut le rôle dans l'étape 3
      if (!isSelected) {
        setMemberRoles(prevRoles => ({ ...prevRoles, [id]: 'MEMBER' }))
      } else {
        setMemberRoles(prevRoles => {
          const copy = { ...prevRoles }
          delete copy[id]
          return copy
        })
      }
      
      return nextList
    })
  }

  const handleRoleChange = (userId, role) => {
    setMemberRoles(prev => ({
      ...prev,
      [userId]: role
    }))
  }

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      alert('Veuillez donner un nom au groupe')
      return
    }

    setSubmitting(true)
    try {
      // Préparer la liste des membres initiaux
      const initialMembers = selectedUserIds.map(id => {
        const u = availableUsers.find(x => x.id === id)
        return {
          userId: id,
          role: memberRoles[id] || 'MEMBER',
          userType: u ? u.type : 'STUDENT'
        }
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          isPrivate,
          features,
          initialMembers
        })
      })

      const result = await response.json()
      if (response.ok && result.success) {
        alert('Groupe créé avec succès !')
        onSuccess && onSuccess(result.data)
        onClose()
      } else {
        alert(result.error || 'Erreur lors de la création du groupe')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur serveur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="group-modal-backdrop">
      <div className="group-modal-container">
        
        {/* En-tête */}
        <div className="group-modal-header">
          <h3>Créer un nouveau groupe</h3>
          <button className="group-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Indicateur d'étape */}
        <div className="group-modal-steps">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1. Général</div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2. Membres</div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3. Droits</div>
        </div>

        {/* Étape 1 : Infos Générales */}
        {step === 1 && (
          <div className="group-modal-body">
            <div className="form-group">
              <label>Nom du groupe *</label>
              <input 
                type="text" 
                placeholder="Ex: Club Théâtre, Équipe pédagogique..." 
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            
            <div className="form-group">
              <label>Description (Optionnelle)</label>
              <textarea 
                placeholder="Décrivez l'objet de ce groupe..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="form-group form-checkbox">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isPrivate} 
                  onChange={e => setIsPrivate(e.target.checked)}
                />
                <span>Groupe Privé (sur invitation uniquement)</span>
              </label>
              <p className="help-text">
                Si activé, seuls les membres invités peuvent rejoindre. Sinon, les utilisateurs pourront utiliser le code pour s'y joindre.
              </p>
            </div>

            <div className="form-group">
              <label>Fonctionnalités activées</label>
              <div className="features-checklist">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={features.wall} 
                    onChange={e => setFeatures(prev => ({ ...prev, wall: e.target.checked }))}
                  />
                  <span>Mur d'actualités (Feed)</span>
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={features.chat} 
                    onChange={e => setFeatures(prev => ({ ...prev, chat: e.target.checked }))}
                  />
                  <span>Messagerie instantanée (Chat)</span>
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={features.fileSharing} 
                    onChange={e => setFeatures(prev => ({ ...prev, fileSharing: e.target.checked }))}
                  />
                  <span>Partage de documents</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 : Sélection des Membres */}
        {step === 2 && (
          <div className="group-modal-body">
            <div className="filters-bar">
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select 
                value={memberTypeFilter} 
                onChange={e => setMemberTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les rôles</option>
                <option value="teacher">Enseignants uniquement</option>
                <option value="student">Élèves uniquement</option>
              </select>
            </div>

            <div className="users-list-container">
              {loadingUsers ? (
                <div className="modal-info-text">Chargement des membres...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="modal-info-text">Aucun utilisateur trouvé</div>
              ) : (
                filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    className={`user-list-item ${selectedUserIds.includes(u.id) ? 'selected' : ''}`}
                    onClick={() => handleToggleSelectUser(u.id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.includes(u.id)}
                      readOnly
                    />
                    <img 
                      src={u.photo} 
                      alt={u.name} 
                      onError={e => { e.target.src = u.type === 'TEACHER' ? '/school/prof.webp' : '/school/student.webp' }}
                      className="user-item-avatar"
                    />
                    <div className="user-item-info">
                      <span className="user-item-name">{u.name}</span>
                      <span className="user-item-role">{u.details}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="selected-counter">
              {selectedUserIds.length} membre(s) sélectionné(s)
            </div>
          </div>
        )}

        {/* Étape 3 : Configuration des Droits */}
        {step === 3 && (
          <div className="group-modal-body">
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-main, #333)' }}>
              Définir les rôles au sein du groupe
            </h4>
            
            <div className="selected-members-roles">
              {selectedUserIds.length === 0 ? (
                <div className="modal-info-text">Aucun membre supplémentaire sélectionné. Vous serez le seul membre (ADMIN).</div>
              ) : (
                selectedUserIds.map(id => {
                  const u = availableUsers.find(x => x.id === id)
                  if (!u) return null
                  return (
                    <div key={id} className="member-role-row">
                      <div className="member-role-row-info">
                        <span className="member-name">{u.name}</span>
                        <span className="member-type">{u.details}</span>
                      </div>
                      <select 
                        value={memberRoles[id] || 'MEMBER'} 
                        onChange={e => handleRoleChange(id, e.target.value)}
                        className="role-select"
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Pied de page (Actions) */}
        <div className="group-modal-footer">
          {step > 1 ? (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              Précédent
            </button>
          ) : (
            <button className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
          )}

          {step < 3 ? (
            <button 
              className="btn-primary" 
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  alert('Le nom du groupe est requis')
                  return
                }
                setStep(step + 1)
              }}
            >
              Suivant
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleCreateGroup}
              disabled={submitting}
            >
              {submitting ? 'Création...' : 'Créer le groupe'}
            </button>
          )}
        </div>

      </div>

      <style jsx>{`
        .group-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .group-modal-container {
          background-color: var(--bg-card, #ffffff);
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 95%;
          max-width: 550px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--border-color, #eef2f5);
        }
        .group-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #eef2f5);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .group-modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-main, #2c3e50);
          font-weight: 700;
        }
        .group-modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-muted, #7f8c8d);
          transition: color 0.2s;
        }
        .group-modal-close:hover {
          color: var(--text-main, #2c3e50);
        }
        .group-modal-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 30px;
          background-color: var(--bg-body, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #eef2f5);
        }
        .step-indicator {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted, #95a5a6);
        }
        .step-indicator.active {
          color: var(--color-primary, #3498db);
        }
        .step-line {
          flex: 1;
          height: 2px;
          background-color: var(--border-color, #eef2f5);
          margin: 0 10px;
        }
        .group-modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main, #34495e);
        }
        .form-group input[type="text"], 
        .form-group textarea {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color, #bdc3c7);
          background-color: var(--bg-input, #fff);
          color: var(--text-main, #2c3e50);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input[type="text"]:focus, 
        .form-group textarea:focus {
          border-color: var(--color-primary, #3498db);
        }
        .form-checkbox {
          flex-direction: column;
          gap: 4px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          color: var(--text-main, #2c3e50);
          cursor: pointer;
          font-weight: 500;
        }
        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .help-text {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-muted, #7f8c8d);
          margin-left: 28px;
        }
        .features-checklist {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          background-color: var(--bg-body, #f8f9fa);
          border-radius: 8px;
        }
        .filters-bar {
          display: flex;
          gap: 10px;
        }
        .search-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 0.9rem;
        }
        .filter-select {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 0.9rem;
          background-color: var(--bg-input, #fff);
          color: var(--text-main, #333);
        }
        .users-list-container {
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .user-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #eef2f5);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .user-list-item:last-child {
          border-bottom: none;
        }
        .user-list-item:hover {
          background-color: var(--bg-body, #f8f9fa);
        }
        .user-list-item.selected {
          background-color: var(--color-primary-light, #ebf5fb);
        }
        .user-item-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-item-info {
          display: flex;
          flex-direction: column;
        }
        .user-item-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main, #2c3e50);
        }
        .user-item-role {
          font-size: 0.8rem;
          color: var(--text-muted, #7f8c8d);
        }
        .selected-counter {
          text-align: right;
          font-size: 0.85rem;
          color: var(--text-muted, #7f8c8d);
          font-weight: 600;
        }
        .modal-info-text {
          padding: 30px;
          text-align: center;
          color: var(--text-muted, #7f8c8d);
          font-size: 0.95rem;
        }
        .selected-members-roles {
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          max-height: 250px;
          overflow-y: auto;
        }
        .member-role-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #eef2f5);
        }
        .member-role-row:last-child {
          border-bottom: none;
        }
        .member-role-row-info {
          display: flex;
          flex-direction: column;
        }
        .member-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main, #2c3e50);
        }
        .member-type {
          font-size: 0.8rem;
          color: var(--text-muted, #7f8c8d);
        }
        .role-select {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 0.85rem;
          background-color: var(--bg-input, #fff);
          color: var(--text-main, #333);
        }
        .group-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #eef2f5);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-primary {
          background-color: var(--color-primary, #3498db);
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background-color: transparent;
          border: 1px solid var(--border-color, #bdc3c7);
          color: var(--text-main, #2c3e50);
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-secondary:hover {
          background-color: var(--bg-body, #f8f9fa);
        }
      `}</style>
    </div>
  )
}
