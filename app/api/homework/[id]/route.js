import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const mongoose = require('mongoose')
const HomeworkEntry = require('../../_/models/ai/HomeworkEntry')
const HomeworkCompletion = require('../../_/models/ai/HomeworkCompletion')

// Normalise une date à minuit UTC du jour.
function normalizeDay(input) {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * PUT /api/homework/{id}
 * Modifie un devoir. Body : { subject?, dateDue?, content?, attachments?, estimatedTime? }
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PUT /api/homework/[id]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { subject, dateDue, content, attachments, estimatedTime } = body || {}

    const update = {}
    if (subject !== undefined) {
      if (!String(subject).trim()) {
        return NextResponse.json({ success: false, error: 'La matière ne peut pas être vide' }, { status: 400 })
      }
      update.subject = String(subject).trim()
    }
    if (content !== undefined) {
      if (!String(content).trim()) {
        return NextResponse.json({ success: false, error: 'Les consignes ne peuvent pas être vides' }, { status: 400 })
      }
      update.content = String(content).trim()
    }
    if (dateDue !== undefined) {
      const day = normalizeDay(dateDue)
      if (!day) return NextResponse.json({ success: false, error: 'dateDue invalide' }, { status: 400 })
      update.dateDue = day
    }
    if (attachments !== undefined) {
      update.attachments = Array.isArray(attachments) ? attachments.filter((a) => typeof a === 'string') : []
    }
    if (estimatedTime !== undefined) {
      update.estimatedTime = Number.isFinite(Number(estimatedTime)) && Number(estimatedTime) > 0
        ? Math.round(Number(estimatedTime))
        : null
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Rien à mettre à jour' }, { status: 400 })
    }

    const updated = await HomeworkEntry.findByIdAndUpdate(id, update, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Devoir introuvable' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('❌ [API] PUT /api/homework/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification du devoir' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/homework/{id}
 * Supprime un devoir et les complétions élèves associées.
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'DELETE /api/homework/[id]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const deleted = await HomeworkEntry.findByIdAndDelete(id).lean()
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Devoir introuvable' }, { status: 404 })
    }
    await HomeworkCompletion.deleteMany({ homeworkId: id })

    return NextResponse.json({ success: true, data: { _id: id } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/homework/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du devoir' },
      { status: 500 }
    )
  }
}
