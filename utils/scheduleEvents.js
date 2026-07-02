/**
 * Helpers PURS pour le nouveau modèle d'emploi du temps basé sur `events[]`.
 *
 * Aucune dépendance Mongoose / serveur ici : ce module est importé aussi bien
 * côté client (ScheduleViewer / ScheduleEditor) que côté serveur (API + helpers).
 *
 * Modèle d'événement :
 *   { dayOfWeek, startTime: "HH:mm", endTime: "HH:mm", type, subjectId, teacherId, notes }
 *   dayOfWeek : 0 = dimanche, 1 = lundi, … 6 = samedi
 *   type      : 'COURSE' | 'BREAK' | 'CUSTOM_EVENT'
 */

// Index = dayOfWeek (0 dimanche → 6 samedi)
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

// Jours affichés par défaut (lundi → vendredi). Samedi/dimanche ajoutés dynamiquement
// si des événements y existent.
const DEFAULT_DAYS = [1, 2, 3, 4, 5]

const EVENT_TYPES = ['COURSE', 'BREAK', 'CUSTOM_EVENT']

// Échelle de rendu du calendrier absolu : 1 minute = N pixels.
const PIXELS_PER_MINUTE = 1.4

const jourToDayOfWeek = (jour) => JOURS.indexOf(String(jour).toLowerCase())
const dayOfWeekToJour = (n) => JOURS[n] || ''

/** "08:15" → 495 (minutes depuis minuit). Renvoie NaN si invalide. */
const timeToMinutes = (time) => {
  if (typeof time !== 'string') return NaN
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/** 495 → "08:15" */
const minutesToTime = (mins) => {
  const m = Math.max(0, Math.round(mins))
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Convertit l'ancien format `planning: { lundi: [...], … }` vers `events[]`.
 * Préserve `subjectId` tel quel (id brut OU objet peuplé).
 */
const planningToEvents = (planning) => {
  if (!planning || typeof planning !== 'object') return []
  const events = []
  for (const jour of Object.keys(planning)) {
    const dayOfWeek = jourToDayOfWeek(jour)
    if (dayOfWeek < 0 || !Array.isArray(planning[jour])) continue
    for (const slot of planning[jour]) {
      if (!slot) continue
      events.push({
        dayOfWeek,
        startTime: slot.heureDebut,
        endTime: slot.heureFin,
        type: 'COURSE',
        subjectId: slot.subjectId ?? null,
        teacherId: slot.teacherId ?? null,
        notes: slot.notes || '',
      })
    }
  }
  return events
}

/**
 * Garantit qu'un document d'emploi du temps possède un tableau `events`.
 * Si absent/vide mais qu'un ancien `planning` existe, migre à la volée.
 * Travaille sur des objets simples (issus de `.lean()`).
 */
const normalizeSchedule = (s) => {
  if (!s) return s
  if (Array.isArray(s.events) && s.events.length > 0) return s
  return { ...s, events: planningToEvents(s.planning) }
}

/**
 * Bornes de la grille en minutes, calculées dynamiquement à partir des événements.
 * Arrondit la borne basse à l'heure pleine inférieure et la haute à l'heure pleine
 * supérieure. `pad` ajoute une marge (minutes) de part et d'autre.
 * Renvoie un défaut raisonnable (08:00–17:00) si aucun événement.
 */
const computeGridBounds = (events, { pad = 0, fallback = [480, 1020] } = {}) => {
  const valid = (events || []).filter(
    (e) => !Number.isNaN(timeToMinutes(e.startTime)) && !Number.isNaN(timeToMinutes(e.endTime))
  )
  if (valid.length === 0) return { startMin: fallback[0], endMin: fallback[1] }

  let min = Infinity
  let max = -Infinity
  for (const e of valid) {
    min = Math.min(min, timeToMinutes(e.startTime))
    max = Math.max(max, timeToMinutes(e.endTime))
  }
  min -= pad
  max += pad
  const startMin = Math.floor(min / 60) * 60
  const endMin = Math.ceil(max / 60) * 60
  return { startMin, endMin }
}

/** Liste des jours (dayOfWeek) à afficher : défaut lun–ven + tout jour ayant des events. */
const daysToDisplay = (events) => {
  const set = new Set(DEFAULT_DAYS)
  for (const e of events || []) {
    if (typeof e.dayOfWeek === 'number') set.add(e.dayOfWeek)
  }
  // Ordre semaine : lundi(1)…samedi(6) puis dimanche(0)
  return Array.from(set).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
}

/** Regroupe et trie les événements par jour. → Map<dayOfWeek, event[]> */
const eventsByDay = (events) => {
  const map = new Map()
  for (const e of events || []) {
    if (!map.has(e.dayOfWeek)) map.set(e.dayOfWeek, [])
    map.get(e.dayOfWeek).push(e)
  }
  for (const list of map.values()) {
    list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }
  return map
}

/** Vérifie le chevauchement de deux plages [s1,e1[ et [s2,e2[ (en minutes). */
const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1

/**
 * Valide un tableau d'événements : horaires cohérents + pas de chevauchement
 * de COURS sur un même jour. Les BREAK peuvent chevaucher (affichage de fond).
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateEvents = (events) => {
  const errors = []
  const list = events || []

  list.forEach((e, i) => {
    const s = timeToMinutes(e.startTime)
    const f = timeToMinutes(e.endTime)
    if (Number.isNaN(s) || Number.isNaN(f)) {
      errors.push(`Horaire invalide (${e.startTime || '?'}–${e.endTime || '?'})`)
    } else if (s >= f) {
      errors.push(`L'heure de fin doit suivre l'heure de début (${e.startTime}–${e.endTime})`)
    }
    if (e.type === 'COURSE' && !e.subjectId) {
      errors.push(`Une matière est requise pour un cours (${dayOfWeekToJour(e.dayOfWeek)} ${e.startTime})`)
    }
  })

  const byDay = eventsByDay(list.filter((e) => e.type === 'COURSE'))
  for (const [dayOfWeek, dayEvents] of byDay) {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i]
        const b = dayEvents[j]
        if (overlaps(timeToMinutes(a.startTime), timeToMinutes(a.endTime), timeToMinutes(b.startTime), timeToMinutes(b.endTime))) {
          errors.push(`Chevauchement le ${dayOfWeekToJour(dayOfWeek)} : ${a.startTime}–${a.endTime} et ${b.startTime}–${b.endTime}`)
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Renvoie les dates du trimestre actuel (T1, T2, T3) pour l'année scolaire.
 * T1: 1er sept - 15 déc
 * T2: 16 déc - 31 mars
 * T3: 1er avr - 10 juil
 */
const getCurrentTrimesterDates = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const day = now.getDate()

  let start, end

  if (month >= 8 && (month < 11 || (month === 11 && day <= 15))) {
    // T1: 1er sept - 15 déc
    start = new Date(year, 8, 1)
    end = new Date(year, 11, 15)
  } else if ((month === 11 && day > 15) || month < 3) {
    // T2: 16 déc - 31 mars
    const startYear = month === 11 ? year : year - 1
    const endYear = month === 11 ? year + 1 : year
    start = new Date(startYear, 11, 16)
    end = new Date(endYear, 2, 31)
  } else {
    // T3: 1er avr - 10 juil
    start = new Date(year, 3, 1)
    end = new Date(year, 6, 10)
  }

  // Ajuster pour le fuseau horaire local
  const offset = start.getTimezoneOffset() * 60000;
  return { 
    validFrom: new Date(start.getTime() - offset).toISOString().split('T')[0], 
    validUntil: new Date(end.getTime() - offset).toISOString().split('T')[0] 
  }
}

/**
 * Renvoie l'année scolaire d'une date donnée (ex: "2023-2024")
 */
const getSchoolYear = (dateInput) => {
  if (!dateInput) return "Inconnue"
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return "Inconnue"
  
  const year = date.getFullYear()
  const month = date.getMonth() // 0 = Janvier, 8 = Septembre

  if (month >= 8) { // Septembre à Décembre
    return `${year}-${year + 1}`
  } else { // Janvier à Août
    return `${year - 1}-${year}`
  }
}

module.exports = {
  JOURS,
  DEFAULT_DAYS,
  EVENT_TYPES,
  PIXELS_PER_MINUTE,
  jourToDayOfWeek,
  dayOfWeekToJour,
  timeToMinutes,
  minutesToTime,
  planningToEvents,
  normalizeSchedule,
  computeGridBounds,
  daysToDisplay,
  eventsByDay,
  validateEvents,
  getCurrentTrimesterDates,
  getSchoolYear,
}
