"use client"

import React, { useState, useEffect } from 'react'
import { useUserRole } from '../../../stores/useUserRole'

export default function UnifiedFeed({ contextType, contextId }) {
  const { userData, userRole, loading: authLoading } = useUserRole()
  
  // Feed states
  const [posts, setPosts] = useState([])
  const [voterNames, setVoterNames] = useState({})
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [activeComposerTab, setActiveComposerTab] = useState('announcement') // announcement | poll
  
  // Composer: Announcement states
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImageUrl, setNewPostImageUrl] = useState('')
  const [sendSMS, setSendSMS] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // Composer: Poll states
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollSettings, setPollSettings] = useState({
    multipleChoices: false,
    isAnonymous: false,
    hasExpiry: false,
    expiresAt: ''
  })

  // Collapsible list for voters details (keyed by post ID)
  const [showVotersMap, setShowVotersMap] = useState({})

  const currentUserId = userData?.clerkId || userData?.id
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'prof'

  // Determine feed endpoint based on contextType
  const getFeedEndpoint = () => {
    if (contextType === 'group') return `/api/groups/${contextId}/feed`
    if (contextType === 'class') return `/api/classes/${contextId}/feed`
    return `/api/global/feed`
  };

  // 1. Fetch Feed Posts
  const fetchFeedPosts = async () => {
    if (contextType !== 'global' && !contextId) return;
    setLoadingPosts(true)
    try {
      const response = await fetch(getFeedEndpoint())
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPosts(result.data)
          setVoterNames(result.voterNames || {})
        }
      }
    } catch (error) {
      console.error('Error fetching feed posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchFeedPosts()
    }
  }, [currentUserId, contextId, contextType])

  // 2. Add/Remove Poll Option
  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ''])
  }

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) return
    const updated = [...pollOptions]
    updated.splice(index, 1)
    setPollOptions(updated)
  }

  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions]
    updated[index] = value
    setPollOptions(updated)
  }

  // 3. Publish Post
  const handlePublish = async (e) => {
    e.preventDefault()
    
    // Validations
    if (activeComposerTab === 'announcement') {
      if (!newPostContent.trim()) return
    } else {
      if (!pollQuestion.trim()) return
      const validOptions = pollOptions.filter(o => o.trim() !== '')
      if (validOptions.length < 2) {
        alert('Veuillez spécifier au moins deux options pour le sondage.')
        return
      }
    }

    setIsPosting(true)
    try {
      let body = {}
      if (activeComposerTab === 'announcement') {
        const urls = newPostImageUrl.trim() ? [newPostImageUrl.trim()] : []
        body = {
          type: 'ANNOUNCEMENT',
          content: newPostContent.trim(),
          mediaUrls: urls,
          smsNotification: sendSMS
        }
      } else {
        body = {
          type: 'POLL',
          pollQuestion: pollQuestion.trim(),
          pollOptions: pollOptions.filter(o => o.trim() !== '').map(opt => ({ text: opt.trim() })),
          pollSettings: {
            multipleChoices: pollSettings.multipleChoices,
            isAnonymous: pollSettings.isAnonymous,
            expiresAt: pollSettings.hasExpiry && pollSettings.expiresAt ? new Date(pollSettings.expiresAt) : null
          },
          smsNotification: sendSMS
        }
      }

      const response = await fetch(getFeedEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        // Reset inputs
        setNewPostContent('')
        setNewPostImageUrl('')
        setPollQuestion('')
        setPollOptions(['', ''])
        setPollSettings({
          multipleChoices: false,
          isAnonymous: false,
          hasExpiry: false,
          expiresAt: ''
        })
        setSendSMS(false)
        fetchFeedPosts()
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur lors de la publication')
      }
    } catch (error) {
      console.error('Error posting to feed:', error)
    } finally {
      setIsPosting(false)
    }
  }

  // 4. Handle Voting
  const handleVote = async (postId, optionId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      })

      if (response.ok) {
        fetchFeedPosts()
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur lors du vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  // Helper checks
  const hasUserVotedOnOption = (option, userId) => option.voters?.includes(userId)
  const hasUserVotedOnPoll = (post, userId) => post.pollOptions?.some(opt => opt.voters?.includes(userId))

  // Toggle voters view
  const toggleVotersView = (postId) => {
    setShowVotersMap(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Check if current user is authorized to create a post in this context
  const canCreatePost = () => {
    if (contextType === 'group') return true; // Checked at page level or allowed for members
    return isTeacherOrAdmin; // Classes and Global: teachers/admins only
  }

  if (authLoading) {
    return <div className="feed-loading">Chargement de la messagerie...</div>
  }

  return (
    <div className="unified-feed-container">
      {/* 1. Composer (Création de publication) */}
      {canCreatePost() && (
        <div className="composer-card">
          <div className="composer-tabs">
            <button
              className={`composer-tab-btn ${activeComposerTab === 'announcement' ? 'active' : ''}`}
              onClick={() => setActiveComposerTab('announcement')}
            >
              📰 Écrire une annonce
            </button>
            <button
              className={`composer-tab-btn ${activeComposerTab === 'poll' ? 'active' : ''}`}
              onClick={() => setActiveComposerTab('poll')}
            >
              📊 Créer un sondage
            </button>
          </div>

          <form onSubmit={handlePublish} className="composer-form">
            {activeComposerTab === 'announcement' ? (
              <div className="tab-pane">
                <textarea
                  placeholder="Publiez une annonce, un mot d'explication ou une consigne sur le mur..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  rows={3}
                  required
                />
                <input
                  type="text"
                  placeholder="URL d'une photo / document (facultatif)"
                  value={newPostImageUrl}
                  onChange={e => setNewPostImageUrl(e.target.value)}
                  className="composer-input"
                />
              </div>
            ) : (
              <div className="tab-pane poll-pane">
                <input
                  type="text"
                  placeholder="Poser une question..."
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="composer-input question-input"
                  required
                />

                <div className="poll-options-list">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="poll-option-input-wrapper">
                      <span className="option-number">{idx + 1}</span>
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={e => handlePollOptionChange(idx, e.target.value)}
                        className="composer-input"
                        required
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="remove-option-btn"
                          onClick={() => handleRemovePollOption(idx)}
                          title="Supprimer cette option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="add-option-btn"
                >
                  ➕ Ajouter une option
                </button>

                <div className="poll-settings">
                  <label className="settings-checkbox">
                    <input
                      type="checkbox"
                      checked={pollSettings.multipleChoices}
                      onChange={e => setPollSettings({ ...pollSettings, multipleChoices: e.target.checked })}
                    />
                    <span>Permettre les choix multiples</span>
                  </label>
                  <label className="settings-checkbox">
                    <input
                      type="checkbox"
                      checked={pollSettings.isAnonymous}
                      onChange={e => setPollSettings({ ...pollSettings, isAnonymous: e.target.checked })}
                    />
                    <span>Sondage Anonyme</span>
                  </label>
                  
                  <div className="expiry-setting">
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={pollSettings.hasExpiry}
                        onChange={e => setPollSettings({ ...pollSettings, hasExpiry: e.target.checked })}
                      />
                      <span>Définir une date d'expiration</span>
                    </label>
                    {pollSettings.hasExpiry && (
                      <input
                        type="datetime-local"
                        value={pollSettings.expiresAt}
                        onChange={e => setPollSettings({ ...pollSettings, expiresAt: e.target.value })}
                        className="composer-input expiry-date-input"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Composer Footer (SMS checkbox for Class/Global, submit button) */}
            <div className="composer-footer">
              {(contextType === 'class') && (
                <label className="settings-checkbox sms-checkbox">
                  <input
                    type="checkbox"
                    checked={sendSMS}
                    onChange={e => setSendSMS(e.target.checked)}
                  />
                  <span>📱 Notifier également les parents par SMS (Simulé)</span>
                </label>
              )}
              <button type="submit" className="publish-btn" disabled={isPosting}>
                {isPosting ? 'Publication en cours...' : 'Publier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Posts List */}
      <div className="posts-list-container">
        {loadingPosts ? (
          <div className="feed-loading-spinner">Chargement du fil d'actualités...</div>
        ) : posts.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">📢</div>
            <p>Aucune publication sur le mur pour le moment.</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => {
              const isPoll = post.type === 'POLL'
              const userVoted = isPoll ? hasUserVotedOnPoll(post, currentUserId) : false
              const pollExpired = isPoll && post.pollSettings?.expiresAt && new Date(post.pollSettings.expiresAt) < new Date()
              const showResults = isPoll && (userVoted || pollExpired)
              
              // Total votes on poll
              const totalVotes = isPoll 
                ? post.pollOptions.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0)
                : 0

              return (
                <div key={post._id} className="post-card">
                  {/* Card Header */}
                  <div className="post-header">
                    <div className="post-author-avatar">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="post-author-info">
                      <span className="post-author-name">{post.authorName}</span>
                      <span className="post-date">
                        {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {isPoll && (
                      <span className="post-badge poll-badge">
                        📊 Sondage
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="post-body">
                    {/* Announcement text */}
                    {post.content && <p className="post-content-text">{post.content}</p>}

                    {/* Announcement media */}
                    {!isPoll && post.mediaUrls && post.mediaUrls.map((url, i) => (
                      <div key={i} className="post-media-container">
                        {url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img src={url} alt="Média partagé" className="post-image" />
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="post-file-link">
                            📄 Consulter le document partagé ({url.split('/').pop()})
                          </a>
                        )}
                      </div>
                    ))}

                    {/* Poll Section */}
                    {isPoll && (
                      <div className="post-poll-container">
                        <h4 className="poll-question">{post.pollQuestion}</h4>

                        {post.pollSettings?.expiresAt && (
                          <div className={`poll-timer ${pollExpired ? 'expired' : ''}`}>
                            {pollExpired ? '⌛ Expiré' : `⌛ Expire le : ${new Date(post.pollSettings.expiresAt).toLocaleString('fr-FR')}`}
                          </div>
                        )}

                        <div className="poll-options-container">
                          {post.pollOptions.map(opt => {
                            const voteCount = opt.voters?.length || 0
                            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                            const votedForThis = hasUserVotedOnOption(opt, currentUserId)

                            if (showResults) {
                              return (
                                <div key={opt.id} className={`poll-result-bar-wrapper ${votedForThis ? 'user-choice' : ''}`}>
                                  <div className="poll-result-bar-label">
                                    <span className="opt-text">
                                      {opt.text} {votedForThis && ' ✔️'}
                                    </span>
                                    <span className="opt-count">{voteCount} vote(s) ({percentage}%)</span>
                                  </div>
                                  <div className="poll-result-bar-bg">
                                    <div 
                                      className="poll-result-bar-fill" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            } else {
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVote(post._id, opt.id)}
                                  className="poll-vote-btn"
                                >
                                  {opt.text}
                                </button>
                              )
                            }
                          })}
                        </div>

                        {/* Poll Footer Actions */}
                        <div className="poll-footer-actions">
                          {/* Voter toggle mode (only if not expired and user has voted) */}
                          {userVoted && !pollExpired && (
                            <button 
                              type="button" 
                              className="change-vote-link"
                              onClick={() => handleVote(post._id, post.pollOptions.find(o => o.voters.includes(currentUserId)).id)}
                            >
                              Retirer / Modifier mon vote
                            </button>
                          )}

                          {/* Show voter names (Teacher/Admin or author, if not anonymous) */}
                          {(isTeacherOrAdmin || post.authorId === currentUserId) && (
                            <button
                              type="button"
                              onClick={() => toggleVotersView(post._id)}
                              className="voters-detail-toggle-btn"
                            >
                              {showVotersMap[post._id] ? 'Masquer les votants 👁️' : 'Voir les votants 👁️'}
                            </button>
                          )}
                        </div>

                        {/* Expandable Voters List */}
                        {showVotersMap[post._id] && (
                          <div className="voters-detail-list">
                            {post.pollSettings?.isAnonymous ? (
                              <p className="anonymous-notice">🔒 Ce sondage est configuré comme anonyme.</p>
                            ) : (
                              post.pollOptions.map(opt => (
                                <div key={opt.id} className="voter-option-group">
                                  <strong className="option-title">{opt.text} :</strong>
                                  {opt.voters?.length === 0 ? (
                                    <span className="no-voters-label">Aucun votant</span>
                                  ) : (
                                    <ul className="voters-name-ul">
                                      {opt.voters.map(vid => (
                                        <li key={vid} className="voter-name-li">
                                          {voterNames[vid] || `Membre (${vid.slice(-4)})`}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .unified-feed-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 16px;
        }
        .feed-loading {
          padding: 24px;
          text-align: center;
          color: var(--text-muted, #7f8c8d);
          font-weight: 500;
        }
        .composer-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .composer-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color, #eef2f5);
          background-color: var(--bg-body, #f8fafc);
        }
        .composer-tab-btn {
          flex: 1;
          padding: 14px;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-muted, #64748b);
          transition: all 0.2s ease;
          outline: none;
        }
        .composer-tab-btn:hover {
          color: var(--color-primary, #3b82f6);
          background-color: rgba(59, 130, 246, 0.02);
        }
        .composer-tab-btn.active {
          color: var(--color-primary, #3b82f6);
          background-color: var(--bg-card, #ffffff);
          border-bottom: 2px solid var(--color-primary, #3b82f6);
        }
        .composer-form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tab-pane {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        textarea {
          width: 100%;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 0.95rem;
          color: var(--text-main, #1e293b);
          resize: vertical;
          outline: none;
          background-color: var(--bg-card, #ffffff);
        }
        textarea:focus {
          border-color: var(--color-primary, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .composer-input {
          width: 100%;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.9rem;
          color: var(--text-main, #1e293b);
          outline: none;
          background-color: var(--bg-card, #ffffff);
        }
        .composer-input:focus {
          border-color: var(--color-primary, #3b82f6);
        }
        .question-input {
          font-weight: 600;
          font-size: 1rem;
        }
        .poll-pane {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .poll-options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .poll-option-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .option-number {
          font-size: 0.9rem;
          font-weight: bold;
          color: var(--text-muted, #64748b);
          min-width: 16px;
        }
        .remove-option-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 4px 8px;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        .remove-option-btn:hover {
          background-color: #fee2e2;
        }
        .add-option-btn {
          align-self: flex-start;
          background: none;
          border: 1px dashed var(--color-primary, #3b82f6);
          color: var(--color-primary, #3b82f6);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .add-option-btn:hover {
          background-color: rgba(59, 130, 246, 0.05);
        }
        .poll-settings {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color, #eef2f5);
        }
        .settings-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main, #334155);
        }
        .settings-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .expiry-setting {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .expiry-date-input {
          max-width: 200px;
          padding: 6px 10px;
        }
        .composer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          border-top: 1px solid var(--border-color, #eef2f5);
          padding-top: 14px;
          flex-wrap: wrap;
        }
        .sms-checkbox {
          color: var(--color-primary, #2563eb);
          font-weight: bold;
        }
        .publish-btn {
          background-color: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .publish-btn:hover {
          background-color: var(--color-primary-dark, #2563eb);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .feed-loading-spinner {
          text-align: center;
          padding: 40px;
          color: var(--text-muted, #64748b);
          font-weight: 500;
        }
        .empty-feed {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          color: var(--text-muted, #64748b);
        }
        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .post-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #eef2f5);
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
          padding: 20px;
          transition: transform 0.2s ease;
        }
        .post-card:hover {
          transform: translateY(-2px);
        }
        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .post-author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--color-primary, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
        }
        .post-author-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .post-author-name {
          font-weight: 700;
          color: var(--text-main, #1e293b);
          font-size: 0.95rem;
        }
        .post-date {
          font-size: 0.8rem;
          color: var(--text-muted, #94a3b8);
        }
        .post-badge {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .poll-badge {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .post-content-text {
          font-size: 1rem;
          line-height: 1.5;
          color: var(--text-main, #334155);
          white-space: pre-wrap;
          margin: 0 0 14px 0;
        }
        .post-media-container {
          margin-top: 12px;
          border-radius: 10px;
          overflow: hidden;
        }
        .post-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: cover;
          border-radius: 10px;
        }
        .post-file-link {
          display: inline-block;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 16px;
          color: #475569;
          font-weight: 600;
          text-decoration: none;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        .post-file-link:hover {
          background-color: #e2e8f0;
        }
        
        /* Poll styling */
        .post-poll-container {
          background-color: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          margin-top: 10px;
        }
        .poll-question {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .poll-timer {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .poll-timer.expired {
          color: #ef4444;
          font-weight: 600;
        }
        .poll-options-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .poll-vote-btn {
          width: 100%;
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .poll-vote-btn:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
          color: #2563eb;
        }
        .poll-result-bar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .poll-result-bar-wrapper.user-choice .opt-text {
          font-weight: 700;
          color: #2563eb;
        }
        .poll-result-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 500;
          color: #334155;
        }
        .poll-result-bar-bg {
          width: 100%;
          height: 10px;
          background-color: #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
        }
        .poll-result-bar-fill {
          height: 100%;
          background-color: #3b82f6;
          border-radius: 20px;
        }
        .poll-result-bar-wrapper.user-choice .poll-result-bar-fill {
          background-color: #2563eb;
        }
        .poll-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 12px;
        }
        .change-vote-link {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }
        .change-vote-link:hover {
          color: #334155;
        }
        .voters-detail-toggle-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .voters-detail-toggle-btn:hover {
          text-decoration: underline;
        }
        .voters-detail-list {
          margin-top: 14px;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          font-size: 0.85rem;
        }
        .anonymous-notice {
          color: #64748b;
          font-style: italic;
          margin: 0;
        }
        .voter-option-group {
          margin-bottom: 10px;
        }
        .voter-option-group:last-child {
          margin-bottom: 0;
        }
        .option-title {
          color: #0f172a;
        }
        .no-voters-label {
          color: #94a3b8;
          margin-left: 8px;
        }
        .voters-name-ul {
          margin: 4px 0 0 16px;
          padding: 0;
          list-style: disc;
          color: #475569;
        }
        .voter-name-li {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  )
}
