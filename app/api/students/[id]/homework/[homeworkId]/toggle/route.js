import { NextResponse } from 'next/server'
import { authWithFallback } from '../../../../../lib/authWithFallback'
import dbConnect from '../../../../../lib/dbConnect'

const mongoose = require('mongoose')
const HomeworkCompletion = require('../../../../../_/models/ai/HomeworkCompletion')

/**
 * POST /api/students/{id}/homework/{homeworkId}/toggle
 * Bascule l'état « fait » d'un devoir pour un élève.
 * - Pas de ligne / TODO  → crée une complétion DONE.
 * - Déjà DONE            → supprime la ligne (repasse « à faire »).
 * Renvoie { done: boolean }.
 */
export async function POST(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'POST /api/students/[id]/homework/[homeworkId]/toggle')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id: studentId, homeworkId } = await params
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(homeworkId)) {
      return NextResponse.json({ success: false, error: 'Identifiant invalide' }, { status: 400 })
    }

    const existing = await HomeworkCompletion.findOne({ studentId, homeworkId })
    if (existing && existing.status === 'DONE') {
      await HomeworkCompletion.deleteOne({ _id: existing._id })
      return NextResponse.json({ success: true, data: { done: false } })
    }

    await HomeworkCompletion.findOneAndUpdate(
      { studentId, homeworkId },
      { $set: { status: 'DONE', updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    return NextResponse.json({ success: true, data: { done: true } })
  } catch (error) {
    console.error('❌ [API] POST /api/students/[id]/homework/[homeworkId]/toggle:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du devoir' },
      { status: 500 }
    )
  }
}
