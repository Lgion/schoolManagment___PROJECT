import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Import dynamique pour les modèles Mongoose
const Schedule = require('../../_/models/ai/Schedule')
const { archiveSchedule, convertPlanningToDetails } = require('../../../../utils/scheduleHelpers')

/**
 * GET /api/schedules/[id]
 * Récupère un emploi du temps spécifique
 */
export async function GET(request, { params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
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
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { label, planning, dateDebut, dateFin } = body

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
    if (dateDebut) schedule.dateDebut = new Date(dateDebut)
    if (dateFin) schedule.dateFin = new Date(dateFin)

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
 * PATCH /api/schedules/[id]/archive
 * Archive un emploi du temps (pas de suppression)
 */
export async function PATCH(request, { params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = params

    const archivedSchedule = await archiveSchedule(id, userId)

    return NextResponse.json({
      success: true,
      data: archivedSchedule,
      message: 'Emploi du temps archivé avec succès'
    })

  } catch (error) {
    console.error('Erreur PATCH /api/schedules/[id]/archive:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
