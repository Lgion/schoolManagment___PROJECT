// Helpers client pour les documents de cours (PDF) d'une classe.
// Fetch simple : l'authentification Clerk passe par les cookies (middleware).

export async function fetchDocuments(classId) {
  const res = await fetch(`/api/classes/${classId}/documents`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur chargement des documents')
  return data.data
}

export async function deleteDocument(classId, docId) {
  const res = await fetch(`/api/classes/${classId}/documents/${docId}`, { method: 'DELETE' })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression')
  return data.data
}

/**
 * Upload d'un document via XMLHttpRequest pour suivre la progression réelle
 * (fetch n'expose pas la progression d'upload).
 *
 * @param {string} classId
 * @param {File} file
 * @param {string} title
 * @param {(percent:number) => void} [onProgress] appelée avec 0..100
 * @returns {Promise<object>} le document créé
 */
export function uploadDocument(classId, file, title, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/classes/${classId}/documents`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch (_) {
        return reject(new Error('Réponse serveur invalide'))
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.success) {
        resolve(data.data)
      } else {
        reject(new Error(data.error || `Erreur ${xhr.status} lors de l'envoi`))
      }
    }

    xhr.onerror = () => reject(new Error("Erreur réseau lors de l'envoi"))
    xhr.send(formData)
  })
}

// Formate une taille en octets vers une chaîne lisible (Ko / Mo).
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// Formate une date ISO vers un format court français (jj/mm/aaaa).
export function formatDocDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (_) {
    return ''
  }
}

// Met en forme un nom de prof peuplé (populate `nom prenoms`) -> "M. Dupont".
export function formatTeacherName(teacher) {
  if (!teacher) return ''
  const prenom = Array.isArray(teacher.prenoms) ? teacher.prenoms[0] : teacher.prenoms
  const initiale = prenom ? `${prenom[0]}. ` : ''
  return `${initiale}${teacher.nom || ''}`.trim()
}
