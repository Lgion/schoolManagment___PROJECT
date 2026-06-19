import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const mongoose = require('mongoose')
const EventModel = require('../../_/models/ai/Event')

const TYPES = ['SORTIE', 'EVALUATION', 'REUNION', 'FERMETURE', 'AUTRE']

/**
 * PUT /api/events/{id}
 * Met à jour un événement. Champs acceptés : title, type, startDate, endDate,
 * isGlobal, classId, location, description, notifyParents.
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PUT /api/events/[id]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const body = await request.json()

    const event = await EventModel.findById(id)
    if (!event) {
      return NextResponse.json({ success: false, error: 'Événement non trouvé' }, { status: 404 })
    }

    if (body.title !== undefined) {
      if (!String(body.title).trim()) {
        return NextResponse.json({ success: false, error: 'Le titre est requis' }, { status: 400 })
      }
      event.title = String(body.title).trim()
    }
    if (body.type !== undefined) event.type = TYPES.includes(body.type) ? body.type : 'AUTRE'
    if (body.location !== undefined) event.location = String(body.location || '').trim()
    if (body.description !== undefined) event.description = String(body.description || '').trim()
    if (body.notifyParents !== undefined) event.notifyParents = Boolean(body.notifyParents)

    if (body.startDate !== undefined) {
      const start = new Date(body.startDate)
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json({ success: false, error: 'Dates invalides' }, { status: 400 })
      }
      event.startDate = start
    }
    if (body.endDate !== undefined) {
      const end = new Date(body.endDate)
      if (Number.isNaN(end.getTime())) {
        return NextResponse.json({ success: false, error: 'Dates invalides' }, { status: 400 })
      }
      event.endDate = end
    }

    // Portée : appliquer les champs fournis…
    if (body.isGlobal !== undefined) event.isGlobal = Boolean(body.isGlobal)
    if (body.classId !== undefined && mongoose.Types.ObjectId.isValid(String(body.classId))) {
      event.classId = body.classId
      // Poser explicitement une classe ⇒ événement de classe (sauf isGlobal explicite contraire).
      if (body.isGlobal === undefined) event.isGlobal = false
    }
    // …puis garantir l'invariant : global ⇒ pas de classId ; sinon classId valide requis.
    if (event.isGlobal) {
      event.classId = null
    } else if (!event.classId || !mongoose.Types.ObjectId.isValid(String(event.classId))) {
      return NextResponse.json({ success: false, error: 'Un événement de classe requiert un classId valide' }, { status: 400 })
    }

    // Cohérence start/end AVANT persistance.
    if (event.endDate < event.startDate) {
      return NextResponse.json({ success: false, error: 'La date de fin doit suivre la date de début' }, { status: 400 })
    }

    await event.save()
    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('❌ [API] PUT /api/events/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la modification de l\'événement' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/{id}
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'DELETE /api/events/[id]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const event = await EventModel.findByIdAndDelete(id)
    if (!event) {
      return NextResponse.json({ success: false, error: 'Événement non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { _id: id } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/events/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression de l\'événement' }, { status: 500 })
  }
}
