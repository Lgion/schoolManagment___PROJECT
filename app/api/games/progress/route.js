import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const mongoose = require('mongoose')
const StudentGameProgress = require('../../_/models/ai/StudentGameProgress')

/**
 * GET /api/games/progress?studentId=...
 * Historique des scores d'un élève (du plus récent au plus ancien).
 */
export async function GET(request) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/games/progress')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, error: 'studentId invalide' }, { status: 400 })
    }

    const progress = await StudentGameProgress.find({ studentId }).sort({ playedAt: -1 }).lean()
    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error('❌ [API] GET /api/games/progress:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des scores' }, { status: 500 })
  }
}

/**
 * POST /api/games/progress
 * Enregistre un score. Body : { studentId, gameKey, gameTitle, score, total }.
 */
export async function POST(request) {
  try {
    const authResult = await authWithFallback(request, 'POST /api/games/progress')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const body = await request.json()
    const { studentId, gameKey, gameTitle, score, total } = body || {}

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, error: 'studentId invalide' }, { status: 400 })
    }
    if (!gameKey || typeof gameKey !== 'string') {
      return NextResponse.json({ success: false, error: 'gameKey requis' }, { status: 400 })
    }

    const entry = await StudentGameProgress.create({
      studentId,
      gameKey,
      gameTitle: typeof gameTitle === 'string' ? gameTitle.slice(0, 200) : '',
      score: Number.isFinite(score) ? score : 0,
      total: Number.isFinite(total) ? total : 0,
      status: 'COMPLETED',
    })

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] POST /api/games/progress:', error)
    return NextResponse.json({ success: false, error: "Erreur lors de l'enregistrement du score" }, { status: 500 })
  }
}
