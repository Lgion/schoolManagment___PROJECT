// Année scolaire (France) : septembre → août.
// Pure (aucune dépendance serveur) : utilisable côté API et côté client.

/**
 * Renvoie l'année scolaire d'une date au format "AAAA-AAAA".
 * Ex. 2025-09-15 → "2025-2026" ; 2026-06-22 → "2025-2026".
 */
export function academicYearOf(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = d.getMonth() // 0=janv … 8=sept
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}
