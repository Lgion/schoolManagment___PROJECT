import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/authWithFallback'
import dbConnect from '../../../../lib/dbConnect'

const PointTransaction = require('../../../../_/models/ai/PointTransaction')
// S'assurer que les modèles référencés sont enregistrés avant les populate
require('../../../../_/models/ai/PointLabel')
require('../../../../_/models/ai/Teacher')

/**
 * GET /api/students/{id}/points/history
 * Récupère l'historique complet des bonus/malus de l'élève (le plus récent d'abord).
 * Query optionnelle : ?limit=N (défaut 100).
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request, 'GET /api/students/[id]/points/history')
    if (auth instanceof NextResponse) return auth

    await dbConnect()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 100, 500)

    const history = await PointTransaction.find({ studentId: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('labelId', 'name type icon')
      .populate('teacherId', 'nom prenoms')
      .lean()

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    })
  } catch (error) {
    console.error('❌ [API] GET /api/students/[id]/points/history:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
