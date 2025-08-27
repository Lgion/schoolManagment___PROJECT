import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'

// Import dynamique pour les modèles Mongoose
const Schedule = require('../../_/models/ai/Schedule')
const { archiveSchedule, reactivateSchedule, convertPlanningToDetails } = require('../../../../utils/scheduleHelpers')

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

    const { id } = params

    const schedule = await Schedule.findById(id)
      .populate('planning.lundi.subjectId planning.mardi.subjectId planning.mercredi.subjectId planning.jeudi.subjectId planning.vendredi.subjectId planning.samedi.subjectId')

    if (!schedule) {
      return NextResponse.json(
        { error: 'Emploi du temps non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schedule
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

    const { id } = params
    const body = await request.json()

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

    // Sauvegarde l'état avant modification pour l'historique
    const oldPlanning = schedule.planning

    // Met à jour les champs
    if (label) schedule.label = label
    if (planning) schedule.planning = planning

    // Ajoute la modification à l'historique
    schedule.modifications.push({
      userId,
      action: "updated",
      details: convertPlanningToDetails(oldPlanning)
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
