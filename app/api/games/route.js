import { NextResponse } from 'next/server'
import { authWithFallback } from '../lib/authWithFallback'
import dbConnect from '../lib/dbConnect'

const mongoose = require('mongoose')
const EducationalGame = require('../_/models/ai/EducationalGame')

/**
 * GET /api/games
 * Liste les jeux GÉNÉRÉS PAR IA (les statiques CP1→CE2 vivent côté client).
 * Accès ouvert à tous (spec : pas de filtrage par rôle).
 * Query : level (CM1/CM2…), classId.
 */
export async function GET(request) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/games')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const classId = searchParams.get('classId')

    const filter = { type: 'AI_GENERATED' }
    if (level) filter.level = level
    if (classId && mongoose.Types.ObjectId.isValid(classId)) filter.classId = classId

    const games = await EducationalGame.find(filter).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: games })
  } catch (error) {
    console.error('❌ [API] GET /api/games:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des jeux' }, { status: 500 })
  }
}
