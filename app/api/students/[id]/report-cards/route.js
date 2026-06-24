import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'

const mongoose = require('mongoose')
const ReportCard = require('../../../_/models/ai/ReportCard')

/**
 * GET /api/students/{id}/report-cards
 * Liste les bulletins d'un élève (toutes années/périodes), le plus récent d'abord.
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request, 'GET /api/students/[id]/report-cards')
    if (auth instanceof NextResponse) return auth

    await dbConnect()

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const schoolKey = cookieStore.get('x-school-key')?.value || 'ecole_st_martin';

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const cards = await ReportCard.find({ schoolKey, studentId: id })
      .sort({ schoolYear: -1, period: 1 })
      .lean()
    return NextResponse.json({ success: true, data: cards })
  } catch (error) {
    console.error('❌ [API] GET /api/students/[id]/report-cards:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des bulletins' },
      { status: 500 }
    )
  }
}
