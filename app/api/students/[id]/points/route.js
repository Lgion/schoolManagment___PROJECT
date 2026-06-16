import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'

const PointTransaction = require('../../../_/models/ai/PointTransaction')

/**
 * GET /api/students/{id}/points
 * Récupère le solde courant de bons points de l'élève (somme des transactions),
 * ainsi qu'un récapitulatif bonus / malus.
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request, 'GET /api/students/[id]/points')
    if (auth instanceof NextResponse) return auth

    await dbConnect()

    const { id } = await params

    const agg = await PointTransaction.aggregate([
      { $match: { studentId: new (require('mongoose').Types.ObjectId)(id) } },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amount' },
          totalBonus: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
          totalMalus: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
          count: { $sum: 1 },
        },
      },
    ])

    const summary = agg[0] || { balance: 0, totalBonus: 0, totalMalus: 0, count: 0 }

    return NextResponse.json({
      success: true,
      data: {
        studentId: id,
        balance: summary.balance,
        totalBonus: summary.totalBonus,
        totalMalus: summary.totalMalus,
        transactionCount: summary.count,
      },
    })
  } catch (error) {
    console.error('❌ [API] GET /api/students/[id]/points:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du calcul du solde' },
      { status: 500 }
    )
  }
}
