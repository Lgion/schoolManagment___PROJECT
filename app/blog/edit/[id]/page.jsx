"use client"

import { useParams } from 'next/navigation'
import ArticleEditor from '../../../components/blog/ArticleEditor'
import { useUserRole } from '../../../../stores/useUserRole'

const WRITER_ROLES = ['admin', 'prof', 'eleve', 'parent']

export default function ArticleEditPage() {
  const { id } = useParams()
  const { userRole, loading } = useUserRole()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement…</div>
  }

  if (!WRITER_ROLES.includes(userRole)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
        <h2>Accès refusé</h2>
        <p>Vous devez être connecté (élève, parent, professeur ou admin) pour rédiger un article.</p>
      </div>
    )
  }

  return (
    <div className="blog-edit-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.6rem', color: '#2c3e50', marginBottom: '1rem' }}>
        {id === 'new' ? '✍️ Nouvel article' : '✏️ Modifier l’article'}
      </h1>
      <ArticleEditor id={id} />
    </div>
  )
}
