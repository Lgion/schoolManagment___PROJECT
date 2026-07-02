"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchArticle, updateArticle, deleteArticle, roleBadge, statusMeta, formatDate } from '../../components/blog/blogApi'
import { renderMarkdownToHtml } from '../../components/blog/markdown'
import { useUserRole } from '../../../stores/useUserRole'

export default function ArticleReadPage() {
  const { id } = useParams()
  const router = useRouter()
  const { userRole, clerkUser } = useUserRole()
  const isStaff = userRole === 'admin' || userRole === 'prof'

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const a = await fetchArticle(id)
      setArticle(a)
      setError('')
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [id])

  const moderate = async (action) => {
    setBusy(true)
    try {
      const extra = action === 'reject'
        ? { moderationComment: (typeof window !== 'undefined' ? window.prompt('Motif du refus (optionnel) :', '') : '') || '' }
        : {}
      const updated = await updateArticle(id, { action, ...extra })
      setArticle(updated)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Supprimer cet article ?')) return
    setBusy(true)
    try {
      await deleteArticle(id)
      router.push('/blog')
    } catch (err) {
      setError(err.message || 'Erreur')
      setBusy(false)
    }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement…</div>
  if (error || !article) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#e74c3c' }}>{error || 'Article introuvable'}</p>
        <Link href="/blog">← Retour au blog</Link>
      </div>
    )
  }

  const badge = roleBadge(article.authorRole)
  const sm = statusMeta(article.status)
  const isAuthor = (clerkUser?.id && article.authorId === clerkUser.id) || !clerkUser
  const canEdit = isStaff || (isAuthor && article.status !== 'PUBLISHED')

  return (
    <article className="articleRead">
      <div className="articleRead__top">
        <Link href="/blog" className="articleRead__back">← Blog</Link>
        <div className="articleRead__actions">
          {article.status !== 'PUBLISHED' && (
            <span className="articleRead__status" style={{ '--status-color': sm.color }}>{sm.icon} {sm.label}</span>
          )}
          {canEdit && <Link href={`/blog/edit/${article._id}`} className="articleRead__btn">✏️ Modifier</Link>}
          {isStaff && article.status === 'PENDING_REVIEW' && (
            <>
              <button className="articleRead__btn articleRead__btn--approve" disabled={busy} onClick={() => moderate('approve')}>Approuver</button>
              <button className="articleRead__btn articleRead__btn--reject" disabled={busy} onClick={() => moderate('reject')}>Rejeter</button>
            </>
          )}
          {(isStaff || isAuthor) && <button className="articleRead__btn articleRead__btn--danger" disabled={busy} onClick={remove}>Supprimer</button>}
        </div>
      </div>

      {article.coverImage && (
        <div className="articleRead__hero">
          <img src={article.coverImage} alt="" />
        </div>
      )}

      <h1 className="articleRead__title">{article.title}</h1>

      <div className="articleRead__meta">
        <span className="articleRead__author">{badge.icon} {badge.label} · {article.authorName || 'Anonyme'}</span>
        {article.publishedAt && <span className="articleRead__date">{formatDate(article.publishedAt)}</span>}
      </div>

      {article.tags?.length > 0 && (
        <div className="articleRead__tags">
          {article.tags.map((t) => <span key={t} className="articleRead__tag">{t}</span>)}
        </div>
      )}

      {article.status === 'REJECTED' && article.moderationComment && (
        <p className="articleRead__rejected">Refusé : {article.moderationComment}</p>
      )}

      <div
        className="articleContent articleRead__content"
        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(article.content) }}
      />
    </article>
  )
}
