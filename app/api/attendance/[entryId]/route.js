import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const AttendanceEntry = require('../../_/models/ai/AttendanceEntry')

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

/**
 * PUT /api/attendance/{entryId}
 * Met à jour le statut/commentaire d'un élève sur un appel déjà validé
 * (ex: un élève noté absent arrive finalement en retard).
 * Body : { status?, comment? }
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PUT /api/attendance/[entryId]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { entryId } = await params
    const body = await request.json()
    const { status, comment } = body || {}

    const update = {}
    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'status invalide' },
          { status: 400 }
        )
      }
      update.status = status
    }
    if (comment !== undefined) {
      update.comment = typeof comment === 'string' ? comment.trim() : ''
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rien à mettre à jour' },
        { status: 400 }
      )
    }

    const updated = await AttendanceEntry.findByIdAndUpdate(entryId, update, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Entrée introuvable' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('❌ [API] PUT /api/attendance/[entryId]:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    )
  }
}
