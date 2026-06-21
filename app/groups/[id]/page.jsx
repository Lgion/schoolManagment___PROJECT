"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useUserRole } from '../../../stores/useUserRole'
import UnifiedFeed from '../../components/feed/UnifiedFeed'

export default function GroupDetailPage() {
  const params = useParams()
  const { id: groupId } = params
  const router = useRouter()
  const { userData, loading: authLoading } = useUserRole()

  const [group, setGroup] = useState(null)
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [activeTab, setActiveTab] = useState('feed') // feed, chat, members, files

  // Feed states
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImageUrl, setNewPostImageUrl] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Chat states
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessageContent, setNewMessageContent] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const chatBottomRef = useRef(null)

  // Settings / Admin states
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPrivate, setEditIsPrivate] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  const currentUserId = userData?.clerkId || userData?.id

  // 1. Fetch Group Details
  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGroup(result.data)
          setEditName(result.data.name)
          setEditDescription(result.data.description || '')
          setEditIsPrivate(result.data.isPrivate)
        } else {
          alert(result.error || 'Erreur lors du chargement du groupe')
          router.push('/groups')
        }
      } else {
        router.push('/groups')
      }
    } catch (error) {
      console.error(error)
      router.push('/groups')
    } finally {
      setLoadingGroup(false)
    }
  }

  // 2. Fetch Feed Posts
  const fetchFeedPosts = async () => {
    setLoadingPosts(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/feed`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPosts(result.data)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPosts(false)
    }
  }

  // 3. Fetch Chat Messages
  const fetchChatMessages = async (silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/chat`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setMessages(result.data)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (currentUserId && groupId) {
      fetchGroupDetails()
    }
  }, [currentUserId, groupId])

  // Auto-refresh chat messages when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat' && groupId) {
      fetchChatMessages()
      const interval = setInterval(() => {
        fetchChatMessages(true)
      }, 5000)
      return () => clearInterval(interval)
    } else if ((activeTab === 'feed' || activeTab === 'files') && groupId) {
      fetchFeedPosts()
    }
  }, [activeTab, groupId])

  // Auto scroll chat to bottom when messages load or change
  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // Post on wall
  const handlePublishPost = async (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return

    setIsPosting(true)
    try {
      const urls = newPostImageUrl.trim() ? [newPostImageUrl.trim()] : []
      const response = await fetch(`/api/groups/${groupId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent.trim(), mediaUrls: urls })
      })

      if (response.ok) {
        setNewPostContent('')
        setNewPostImageUrl('')
        fetchFeedPosts()
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur lors de la publication')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsPosting(false)
    }
  }

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessageContent.trim()) return

    setIsSendingMessage(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessageContent.trim() })
      })

      if (response.ok) {
        setNewMessageContent('')
        fetchChatMessages(true)
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur d\'envoi')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return

    try {
      // Pour quitter, on met à jour la liste des membres en filtrant l'utilisateur courant
      const updatedMembers = group.members.filter(m => m.userId !== currentUserId)
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      })

      if (response.ok) {
        alert('Vous avez quitté le groupe')
        router.push('/groups')
      } else {
        alert('Erreur lors du départ du groupe')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!confirm('🚨 ATTENTION 🚨\nCette action supprimera définitivement le groupe et tout son historique.\nContinuer ?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Groupe supprimé avec succès !')
        router.push('/groups')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return

    setSavingSettings(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          isPrivate: editIsPrivate
        })
      })

      if (response.ok) {
        setIsEditingSettings(false)
        fetchGroupDetails()
      } else {
        alert('Erreur lors de la sauvegarde des paramètres')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingSettings(false)
    }
  }

  // Admin update member role
  const handleUpdateMemberRole = async (memberId, newRole) => {
    const updatedMembers = group.members.map(m => {
      if (m.userId === memberId) {
        return { ...m, role: newRole }
      }
      return m
    })

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      })

      if (response.ok) {
        fetchGroupDetails()
      } else {
        alert('Erreur lors de la modification du rôle')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Admin remove member
  const handleRemoveMember = async (memberId) => {
    if (!confirm('Retirer ce membre du groupe ?')) return

    const updatedMembers = group.members.filter(m => m.userId !== memberId)

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      })

      if (response.ok) {
        fetchGroupDetails()
      } else {
        alert('Erreur lors de la suppression du membre')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Extract links/documents from posts
  const sharedFiles = posts
    .filter(p => p.mediaUrls && p.mediaUrls.length > 0)
    .map(p => ({
      url: p.mediaUrls[0],
      name: p.mediaUrls[0].split('/').pop() || 'Fichier partagé',
      author: p.authorName,
      date: p.createdAt
    }))

  const isUserAdmin = group?.members?.find(m => m.userId === currentUserId)?.role === 'ADMIN'
  const isCreator = group?.creatorId === currentUserId

  if (authLoading || loadingGroup) {
    return <div className="group-detail-loading">Chargement du groupe...</div>
  }

  if (!group) {
    return <div className="group-detail-loading">Groupe introuvable</div>
  }

  return (
    <div className="group-detail-container">
      {/* Back button */}
      <div className="back-link">
        <Link href="/groups">← Retour aux groupes</Link>
      </div>

      {/* Header du groupe */}
      <div className="group-detail-header">
        <div className="header-info">
          <div className="title-wrapper">
            <h2 className="group-title">{group.name}</h2>
            <span className={`group-visibility ${group.isPrivate ? 'private' : 'public'}`}>
              {group.isPrivate ? '🔒 Privé' : '🔓 Public'}
            </span>
          </div>
          <p className="group-desc">{group.description || 'Aucune description.'}</p>
          <div className="group-meta">
            <span>👥 {group.members.length} membre(s)</span>
            <span className="dot">•</span>
            <span>Code d'invitation : <strong style={{ color: '#e74c3c' }}>{group.invitationCode}</strong></span>
          </div>
        </div>

        <div className="header-actions">
          {(isUserAdmin || isCreator) && (
            <button className="settings-btn" onClick={() => setIsEditingSettings(!isEditingSettings)}>
              {isEditingSettings ? 'Annuler' : '⚙️ Paramètres'}
            </button>
          )}

          {!isCreator && (
            <button className="leave-btn" onClick={handleLeaveGroup}>
              Quitter le groupe
            </button>
          )}
        </div>
      </div>

      {/* Paramètres (Admin) */}
      {isEditingSettings && (
        <form onSubmit={handleSaveSettings} className="settings-form-container">
          <h3>Modifier les paramètres du groupe</h3>
          <div className="form-group">
            <label>Nom du groupe</label>
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group form-checkbox">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={editIsPrivate}
                onChange={e => setEditIsPrivate(e.target.checked)}
              />
              <span>Rendre le groupe privé</span>
            </label>
          </div>

          <div className="settings-actions">
            <button type="submit" className="save-btn" disabled={savingSettings}>
              {savingSettings ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button type="button" className="delete-btn" onClick={handleDeleteGroup}>
              Supprimer le groupe
            </button>
          </div>
        </form>
      )}

      {/* Onglets (Tabs) */}
      <div className="group-tabs">
        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          📰 Mur d'actualités
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat en direct
        </button>
        <button 
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Membres ({group.members.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📁 Fichiers partagés ({sharedFiles.length})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        
        {/* Onglet : Mur (Feed) */}
        {activeTab === 'feed' && (
          <div className="feed-tab-container">
            <UnifiedFeed contextType="group" contextId={groupId} />
          </div>
        )}

        {/* Onglet : Chat */}
        {activeTab === 'chat' && (
          <div className="chat-tab-container">
            <div className="chat-messages-area">
              {loadingMessages ? (
                <div className="tab-loading">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty-tab-state">
                  <p>Début de la discussion. Envoyez le premier message !</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg._id} className={`chat-message-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                      {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                      <div className={`chat-message-bubble ${isMe ? 'me' : 'other'}`}>
                        <p className="chat-message-content">{msg.content}</p>
                        <span className="chat-message-time">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-area">
              <input 
                type="text" 
                placeholder="Écrivez votre message..." 
                value={newMessageContent}
                onChange={e => setNewMessageContent(e.target.value)}
                required
                disabled={isSendingMessage}
              />
              <button type="submit" disabled={isSendingMessage || !newMessageContent.trim()}>
                {isSendingMessage ? '...' : 'Envoyer'}
              </button>
            </form>
          </div>
        )}

        {/* Onglet : Membres */}
        {activeTab === 'members' && (
          <div className="members-tab-container">
            <div className="members-list">
              {group.members.map(member => {
                const isMemberCreator = group.creatorId === member.userId
                return (
                  <div key={member.userId} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <span className="member-name">
                          {member.name} {member.userId === currentUserId && ' (Vous)'}
                        </span>
                        <span className="member-type">
                          {member.userType === 'TEACHER' ? 'Enseignant' : 
                           member.userType === 'ADMIN' ? 'Administrateur' : 'Élève/Parent'}
                        </span>
                      </div>
                    </div>

                    <div className="member-actions-wrapper">
                      {isMemberCreator ? (
                        <span className="badge creator">Créateur</span>
                      ) : member.role === 'ADMIN' ? (
                        <span className="badge admin">Admin</span>
                      ) : (
                        <span className="badge member">Membre</span>
                      )}

                      {/* Options d'administration du groupe */}
                      {(isUserAdmin || isCreator) && member.userId !== currentUserId && !isMemberCreator && (
                        <div className="admin-actions">
                          {member.role === 'MEMBER' ? (
                            <button 
                              className="action-btn-promote" 
                              onClick={() => handleUpdateMemberRole(member.userId, 'ADMIN')}
                            >
                              Nommer Admin
                            </button>
                          ) : (
                            <button 
                              className="action-btn-promote" 
                              onClick={() => handleUpdateMemberRole(member.userId, 'MEMBER')}
                            >
                              Rétrograder
                            </button>
                          )}
                          <button 
                            className="action-btn-remove" 
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            Retirer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Onglet : Fichiers */}
        {activeTab === 'files' && (
          <div className="files-tab-container">
            {sharedFiles.length === 0 ? (
              <div className="empty-tab-state">
                <p>Aucun document ou lien de média n'a encore été partagé sur le mur.</p>
              </div>
            ) : (
              <div className="files-grid">
                {sharedFiles.map((file, i) => (
                  <div key={i} className="file-card">
                    <div className="file-icon">📄</div>
                    <div className="file-details">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-name">
                        {file.name}
                      </a>
                      <span className="file-meta">
                        Partagé par <strong>{file.author}</strong> le {new Date(file.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx>{`
        .group-detail-container {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .back-link {
          margin-bottom: 20px;
        }
        .back-link a {
          color: var(--color-primary, #3498db);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .back-link a:hover {
          text-decoration: underline;
        }
        .group-detail-header {
          background-color: var(--bg-card, #fff);
          border-radius: 12px;
          border: 1px solid var(--border-color, #eef2f5);
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }
        .header-info {
          flex: 1;
          min-width: 300px;
        }
        .title-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .group-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-main, #2c3e50);
          margin: 0;
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
        .group-desc {
          font-size: 1rem;
          color: var(--text-muted, #7f8c8d);
          margin: 0 0 16px 0;
        }
        .group-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-muted, #95a5a6);
          font-weight: 500;
        }
        .dot {
          color: var(--border-color, #bdc3c7);
        }
        .header-actions {
          display: flex;
          gap: 10px;
        }
        .settings-btn {
          background-color: var(--bg-body, #f2f4f4);
          border: 1px solid var(--border-color, #bdc3c7);
          color: var(--text-main, #34495e);
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .leave-btn {
          background-color: transparent;
          border: 1px solid #e74c3c;
          color: #e74c3c;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .leave-btn:hover {
          background-color: #fdf2f2;
        }
        .settings-form-container {
          background-color: var(--bg-card, #fff);
          border-radius: 12px;
          border: 1px solid #e74c3c;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .settings-form-container h3 {
          margin: 0;
          font-size: 1.15rem;
          color: #e74c3c;
          font-weight: 700;
        }
        .settings-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .save-btn {
          background-color: #2ecc71;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .delete-btn {
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .group-tabs {
          display: flex;
          border-bottom: 2px solid var(--border-color, #eef2f5);
          margin-bottom: 20px;
          overflow-x: auto;
          gap: 8px;
        }
        .tab-btn {
          padding: 12px 18px;
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted, #7f8c8d);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
          transition: color 0.2s, border-color 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-main, #2c3e50);
        }
        .tab-btn.active {
          color: var(--color-primary, #3498db);
          border-bottom-color: var(--color-primary, #3498db);
        }
        .tab-content {
          background-color: var(--bg-card, #fff);
          border-radius: 12px;
          border: 1px solid var(--border-color, #eef2f5);
          padding: 20px;
          min-height: 350px;
        }
        .tab-loading {
          text-align: center;
          padding: 40px;
          color: var(--text-muted, #7f8c8d);
        }
        .empty-tab-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted, #7f8c8d);
        }

        /* Mur / Feed Styles */
        .publish-form {
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 20px;
          background-color: var(--bg-body, #f8f9fa);
        }
        .publish-form textarea {
          width: 100%;
          border: none;
          background: transparent;
          resize: none;
          outline: none;
          font-size: 0.95rem;
          color: var(--text-main, #333);
        }
        .publish-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .image-url-input {
          flex: 1;
          min-width: 200px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #bdc3c7);
          font-size: 0.85rem;
        }
        .publish-btn {
          background-color: var(--color-primary, #3498db);
          color: white;
          border: none;
          padding: 7px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .publish-btn:disabled {
          opacity: 0.5;
        }
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .post-card {
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          padding: 16px;
        }
        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .post-author-avatar {
          width: 38px;
          height: 38px;
          background-color: #3498db;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .post-author-info {
          display: flex;
          flex-direction: column;
        }
        .post-author-name {
          font-weight: 700;
          color: var(--text-main, #2c3e50);
          font-size: 0.95rem;
        }
        .post-date {
          font-size: 0.8rem;
          color: var(--text-muted, #95a5a6);
        }
        .post-body p {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          color: var(--text-main, #333);
          line-height: 1.5;
        }
        .post-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 6px;
          object-fit: contain;
          margin-top: 8px;
        }
        .post-file-link {
          display: inline-block;
          background-color: #f2f4f4;
          padding: 6px 12px;
          border-radius: 6px;
          color: #2980b9;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Chat Styles */
        .chat-tab-container {
          display: flex;
          flex-direction: column;
          height: 450px;
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          overflow: hidden;
        }
        .chat-messages-area {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background-color: #f8f9f9;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-message-bubble-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }
        .chat-message-bubble-wrapper.me {
          align-self: flex-end;
        }
        .chat-message-bubble-wrapper.other {
          align-self: flex-start;
        }
        .chat-sender-name {
          font-size: 0.75rem;
          color: var(--text-muted, #7f8c8d);
          margin-bottom: 3px;
          font-weight: 600;
          margin-left: 6px;
        }
        .chat-message-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .chat-message-bubble.me {
          background-color: var(--color-primary, #3498db);
          color: white;
          border-bottom-right-radius: 2px;
        }
        .chat-message-bubble.other {
          background-color: white;
          color: var(--text-main, #333);
          border-bottom-left-radius: 2px;
          border: 1px solid var(--border-color, #eef2f5);
        }
        .chat-message-content {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
          word-break: break-word;
        }
        .chat-message-time {
          display: block;
          text-align: right;
          font-size: 0.7rem;
          margin-top: 4px;
          opacity: 0.7;
        }
        .chat-input-area {
          display: flex;
          border-top: 1px solid var(--border-color, #eef2f5);
          padding: 10px;
          background-color: white;
          gap: 10px;
        }
        .chat-input-area input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid var(--border-color, #bdc3c7);
          outline: none;
          font-size: 0.9rem;
        }
        .chat-input-area button {
          background-color: var(--color-primary, #3498db);
          color: white;
          border: none;
          padding: 0 18px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Membres Styles */
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .member-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
        }
        .member-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .member-avatar {
          width: 36px;
          height: 36px;
          background-color: #34495e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .member-details {
          display: flex;
          flex-direction: column;
        }
        .member-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main, #2c3e50);
        }
        .member-type {
          font-size: 0.8rem;
          color: var(--text-muted, #7f8c8d);
        }
        .member-actions-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .badge.creator {
          background-color: #fadbd8;
          color: #c0392b;
        }
        .badge.admin {
          background-color: #d4e6f1;
          color: #2980b9;
        }
        .badge.member {
          background-color: #e5e8e8;
          color: #7f8c8d;
        }
        .admin-actions {
          display: flex;
          gap: 6px;
        }
        .action-btn-promote, 
        .action-btn-remove {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .action-btn-promote {
          background-color: #ebf5fb;
          border: 1px solid #a9cce3;
          color: #2980b9;
        }
        .action-btn-remove {
          background-color: #fdf2f2;
          border: 1px solid #fadbd8;
          color: #c0392b;
        }

        /* Fichiers Styles */
        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .file-card {
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 8px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--bg-body, #f8f9fa);
        }
        .file-icon {
          font-size: 1.8rem;
        }
        .file-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .file-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: #2980b9;
          text-decoration: none;
          word-break: break-all;
        }
        .file-name:hover {
          text-decoration: underline;
        }
        .file-meta {
          font-size: 0.75rem;
          color: var(--text-muted, #7f8c8d);
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
        }
      `}</style>
    </div>
  )
}
