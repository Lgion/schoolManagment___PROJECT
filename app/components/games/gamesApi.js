// Helpers client pour les jeux pédagogiques.
// Auth Clerk via cookies (middleware) → fetch nu. Accès ouvert à tous.

export const GAME_LEVELS = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']

export function gameKeyOf(game) {
  // Identifiant unifié : clé statique (string) ou _id Mongo des jeux IA.
  return game?.id || game?._id || ''
}

export async function fetchAiGames({ level, classId } = {}) {
  const qs = new URLSearchParams()
  if (level) qs.set('level', level)
  if (classId) qs.set('classId', classId)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await fetch(`/api/games${suffix}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur chargement des jeux')
  return data.data
}

export async function deleteGame(id) {
  const res = await fetch(`/api/games/${id}`, { method: 'DELETE' })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression')
  return data.data
}

export async function generateGameFromPdf({ file, level, classId }) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('level', level)
  if (classId) fd.append('classId', classId)
  const res = await fetch('/api/school_ai/generate-game', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || 'Erreur lors de la génération')
  return data.data
}

export async function saveGameProgress({ studentId, gameKey, gameTitle, score, total }) {
  const res = await fetch('/api/games/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, gameKey, gameTitle, score, total }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Erreur lors de l'enregistrement du score")
  return data.data
}

export async function fetchGameProgress(studentId) {
  const res = await fetch(`/api/games/progress?studentId=${studentId}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur chargement des scores')
  return data.data
}
