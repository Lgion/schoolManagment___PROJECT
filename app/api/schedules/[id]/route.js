import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'

// Import dynamique pour les modèles Mongoose
const Schedule = require('../../_/models/ai/Schedule')
const { archiveSchedule, reactivateSchedule, convertPlanningToDetails } = require('../../../../utils/scheduleHelpers')
const { normalizeSchedule, planningToEvents, validateEvents } = require('../../../../utils/scheduleEvents')

// Populate couvrant nouveau format (events) et ancien (planning).
const POPULATE_PATHS =
  'events.subjectId ' +
  'planning.lundi.subjectId planning.mardi.subjectId planning.mercredi.subjectId ' +
  'planning.jeudi.subjectId planning.vendredi.subjectId planning.samedi.subjectId'

/**
 * GET /api/schedules/[id]
 * Récupère un emploi du temps spécifique
 */
export async function GET(request, { params }) {
  try {
    // Authentification avec fallback robuste
    const userId = await requireAuth(request, 'GET /api/schedules/[id]')
    
    // Si requireAuth retourne une NextResponse, c'est une erreur d'auth
    if (userId instanceof NextResponse) {
      return userId
    }

    const { id } = await params

    const schedule = await Schedule.findById(id)
      .populate(POPULATE_PATHS)
      .lean()

    if (!schedule) {
      return NextResponse.json(
        { error: 'Emploi du temps non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: normalizeSchedule(schedule)
    })

  } catch (error) {
    console.error('Erreur GET /api/schedules/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/schedules/[id]
 * Met à jour un emploi du temps
 */
export async function PUT(request, { params }) {
  try {
    // Authentification avec fallback robuste
    const userId = await requireAuth(request, 'PUT /api/schedules/[id]')
    
    // Si requireAuth retourne une NextResponse, c'est une erreur d'auth
    if (userId instanceof NextResponse) {
      return userId
    }

    const { id } = await params
    const body = await request.json()
    const { label, validFrom, validUntil } = body

    // Nouveau format `events` privilégié ; `planning` accepté en rétro-compat.
    let events = Array.isArray(body.events) ? body.events : null
    if (!events && body.planning) events = planningToEvents(body.planning)

    const schedule = await Schedule.findById(id)

    if (!schedule) {
      return NextResponse.json(
        { error: 'Emploi du temps non trouvé' },
        { status: 404 }
      )
    }

    if (schedule.isArchived) {
      return NextResponse.json(
        { error: 'Impossible de modifier un emploi du temps archivé' },
        { status: 400 }
      )
    }

    if (events) {
      const validation = validateEvents(events)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Emploi du temps invalide', details: validation.errors },
          { status: 400 }
        )
      }
    }

    // Sauvegarde l'état avant modification pour l'historique
    const before = { events: schedule.events, planning: schedule.planning }

    // Met à jour les champs
    if (label) schedule.label = label
    if (events) {
      schedule.events = events
      schedule.planning = undefined // bascule définitive vers le nouveau format
    }
    if (validFrom !== undefined) schedule.validFrom = validFrom || undefined
    if (validUntil !== undefined) schedule.validUntil = validUntil || null

    // Ajoute la modification à l'historique
    schedule.modifications.push({
      userId,
      action: "updated",
      details: before
    })

    const updatedSchedule = await schedule.save()

    return NextResponse.json({
      success: true,
      data: updatedSchedule
    })

  } catch (error) {
    console.error('Erreur PUT /api/schedules/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/schedules/[id]
 * Archive ou réactive un emploi du temps selon l'action
 */
export async function PATCH(request, { params }) {
  let body
  try {
    // Authentification avec fallback robuste
    const userId = await requireAuth(request, 'PATCH /api/schedules/[id]')
    
    // Si requireAuth retourne une NextResponse, c'est une erreur d'auth
    if (userId instanceof NextResponse) {
      return userId
    }

    const { id } = await params
    body = await request.json()
    const { action } = body

    if (!action || !['archive', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Action requise: "archive" ou "reactivate"' },
        { status: 400 }
      )
    }

    let result
    let message

    if (action === 'archive') {
      result = await archiveSchedule(id, userId)
      message = 'Emploi du temps archivé avec succès'
    } else if (action === 'reactivate') {
      result = await reactivateSchedule(id, userId)
      message = 'Emploi du temps réactivé avec succès'
    }

    return NextResponse.json({
      success: true,
      data: result,
      message
    })

  } catch (error) {
    console.error(`Erreur PATCH /api/schedules/[id] (${body?.action}):`, error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
