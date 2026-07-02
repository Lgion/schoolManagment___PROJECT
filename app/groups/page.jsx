"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUserRole } from '../../stores/useUserRole'
import GroupCreateModal from '../components/groups/GroupCreateModal'

export default function GroupsPage() {
  const { userData, loading: authLoading, hasAnyRole } = useUserRole()
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Rejoindre par code
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  // Modale de création
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentUserId = userData?.clerkId || userData?.id

  const fetchGroups = async () => {
    setLoadingGroups(true)
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGroups(result.data)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchGroups()
    }
  }, [currentUserId])

  const handleJoinByCode = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setJoining(true)
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationCode: joinCode.trim() })
      })

      const result = await response.json()
      if (response.ok) {
        alert(result.message || 'Groupe rejoint avec succès !')
        setJoinCode('')
        fetchGroups()
      } else {
        alert(result.error || 'Erreur lors de la tentative d\'intégration')
      }
    } catch (error) {
      console.error('Erreur lors de l\'intégration:', error)
      alert('Erreur serveur lors de la tentative')
    } finally {
      setJoining(false)
    }
  }

  const handleCopyCode = (code, e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    alert(`Code ${code} copié dans le presse-papier !`)
  }

  // Filtrer les groupes localement
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canCreateGroup = hasAnyRole(['admin', 'prof'])

  if (authLoading) {
    return <div className="groups-loading">Chargement de votre session...</div>
  }

  if (!currentUserId) {
    return (
      <div className="groups-container">
        <div className="empty-state">
          <h2>Non connecté</h2>
          <p>Veuillez vous connecter pour accéder à vos groupes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="groups-container">
      {/* En-tête avec Actions */}
      <div className="groups-header">
        <div>
          <h2 className="groups-title">Mes Groupes de Discussion</h2>
          <p className="groups-subtitle">
            Échangez avec les professeurs, les parents et les élèves de l'école.
          </p>
        </div>

        <div className="header-actions">
          {/* Formulaire Rejoindre via code */}
          <form onSubmit={handleJoinByCode} className="join-form">
            <input 
              type="text" 
              placeholder="Code d'invitation (ex: AZERTY)" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={joining}
            />
            <button type="submit" disabled={joining || !joinCode.trim()}>
              {joining ? 'Connexion...' : 'Rejoindre'}
            </button>
          </form>

          {/* Bouton Création */}
          {canCreateGroup && (
            <button className="create-group-btn" onClick={() => setIsModalOpen(true)}>
              <span className="plus-icon">+</span> Nouveau Groupe
            </button>
          )}
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="search-bar-container">
        <input 
          type="text" 
          placeholder="Rechercher un groupe..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Liste des Groupes */}
      {loadingGroups ? (
        <div className="groups-loading-cards">Chargement des groupes...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>Aucun groupe trouvé</h3>
          <p>
            {searchQuery 
              ? 'Aucun groupe ne correspond à vos critères de recherche.' 
              : 'Vous ne faites partie d\'aucun groupe pour le moment. Rejoignez-en un via un code ou créez-en un.'}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {filteredGroups.map(group => {
            const isUserAdmin = group.members.find(m => m.userId === currentUserId)?.role === 'ADMIN'
            const isCreator = group.creatorId === currentUserId

            return (
              <Link href={`/groups/${group._id}`} key={group._id} className="group-card">
                <div className="group-card-header">
                  <span className={`group-visibility ${group.isPrivate ? 'private' : 'public'}`}>
                    {group.isPrivate ? '🔒 Privé' : '🔓 Public'}
                  </span>
                  {(isUserAdmin || isCreator) && (
                    <span className="user-badge-admin">Admin</span>
                  )}
                </div>

                <h3 className="group-name">{group.name}</h3>
                <p className="group-desc">
                  {group.description || 'Aucune description fournie.'}
                </p>

                <div className="group-card-footer">
                  <div className="members-count">
                    👥 {group.members.length} membre{group.members.length > 1 ? 's' : ''}
                  </div>
                  
                  {/* Code d'invitation cliquable */}
                  <div 
                    className="invitation-code-badge" 
                    onClick={(e) => handleCopyCode(group.invitationCode, e)}
                    title="Cliquer pour copier le code"
                  >
                    Code : <code>{group.invitationCode}</code>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modale de création */}
      <GroupCreateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
        onSuccess={() => fetchGroups()}
      />

      <style jsx>{`
        .groups-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .groups-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
        }
        .groups-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-main, #2c3e50);
          margin: 0 0 6px 0;
        }
        .groups-subtitle {
          margin: 0;
          font-size: 1rem;
          color: var(--text-muted, #7f8c8d);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .join-form {
          display: flex;
          gap: 8px;
        }
        .join-form input {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 0.9rem;
          text-transform: uppercase;
        }
        .join-form button {
          background-color: var(--color-primary, #3498db);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .join-form button:hover {
          background-color: #2980b9;
        }
        .create-group-btn {
          background-color: #2ecc71;
          color: white;
          border: none;
          padding: 9px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s;
        }
        .create-group-btn:hover {
          background-color: #27ae60;
        }
        .plus-icon {
          font-size: 1.1rem;
          line-height: 1;
        }
        .search-bar-container {
          margin-bottom: 24px;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: var(--color-primary, #3498db);
        }
        .groups-loading, 
        .groups-loading-cards {
          text-align: center;
          padding: 50px;
          font-size: 1.1rem;
          color: var(--text-muted, #7f8c8d);
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background-color: var(--bg-card, #fff);
          border-radius: 12px;
          border: 1px dashed var(--border-color, #bdc3c7);
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: var(--text-main, #2c3e50);
        }
        .empty-state p {
          margin: 0;
          color: var(--text-muted, #7f8c8d);
        }
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .group-card {
          background-color: var(--bg-card, #fff);
          border-radius: 12px;
          border: 1px solid var(--border-color, #eef2f5);
          padding: 20px;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .group-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.05);
        }
        .group-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .group-visibility {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .group-visibility.private {
          background-color: #fce4d6;
          color: #d35400;
        }
        .group-visibility.public {
          background-color: #d4efdf;
          color: #27ae60;
        }
        .user-badge-admin {
          background-color: #ebf5fb;
          color: #2980b9;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .group-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-main, #2c3e50);
          margin: 0 0 8px 0;
        }
        .group-desc {
          font-size: 0.9rem;
          color: var(--text-muted, #7f8c8d);
          margin: 0 0 20px 0;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .group-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #eef2f5);
          font-size: 0.85rem;
        }
        .members-count {
          color: var(--text-muted, #7f8c8d);
          font-weight: 500;
        }
        .invitation-code-badge {
          background-color: #f2f4f4;
          color: #34495e;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .invitation-code-badge:hover {
          background-color: #e5e8e8;
        }
        .invitation-code-badge code {
          color: #e74c3c;
        }
      `}</style>
    </div>
  )
}
