// Helpers client pour le blog de l'école. Auth Clerk via cookies → fetch nu.

export const ARTICLE_STATUS_META = {
  DRAFT: { label: 'Brouillon', icon: '📝', color: '#7a7f87' },
  PENDING_REVIEW: { label: 'En attente', icon: '⏳', color: '#e67e22' },
  PUBLISHED: { label: 'Publié', icon: '✅', color: '#2e9e6b' },
  REJECTED: { label: 'Refusé', icon: '⛔', color: '#c0392b' },
}

export const AUTHOR_ROLE_BADGE = {
  admin: { label: 'Admin', icon: '👑' },
  prof: { label: 'Prof', icon: '👨‍🏫' },
  eleve: { label: 'Élève', icon: '🎓' },
  parent: { label: 'Parent', icon: '👪' },
}

export function statusMeta(s) {
  return ARTICLE_STATUS_META[s] || ARTICLE_STATUS_META.DRAFT
}
export function roleBadge(r) {
  return AUTHOR_ROLE_BADGE[r] || { label: r, icon: '👤' }
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function fetchArticles({ view, tag, role, q } = {}) {
  const qs = new URLSearchParams()
  if (view) qs.set('view', view)
  if (tag) qs.set('tag', tag)
  if (role) qs.set('role', role)
  if (q) qs.set('q', q)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await fetch(`/api/articles${suffix}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur chargement des articles')
  return data.data
}

export async function fetchArticle(id) {
  const res = await fetch(`/api/articles/${id}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Article introuvable')
  return data.data
}

export async function createArticle(payload) {
  const res = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Erreur lors de la création")
  return data.data
}

export async function updateArticle(id, body) {
  const res = await fetch(`/api/articles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour')
  return data.data
}

export async function deleteArticle(id) {
  const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression')
  return data.data
}

export async function uploadCover(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/articles/upload-cover', { method: 'POST', body: fd })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Erreur lors de l'upload")
  return data.url
}
