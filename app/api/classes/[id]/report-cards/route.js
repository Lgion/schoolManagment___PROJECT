import { NextResponse } from 'next/server'
import { authWithFallback } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'

const mongoose = require('mongoose')
const ReportCard = require('../../../_/models/ai/ReportCard')

/**
 * GET /api/classes/{classId}/report-cards?schoolYear=&period=
 * Liste les bulletins générés pour une classe (filtrable par année/période).
 */
export async function GET(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/classes/[id]/report-cards')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id: classId } = await params
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json({ success: false, error: 'classId invalide' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const filter = { classId }
    const schoolYear = searchParams.get('schoolYear')
    const period = searchParams.get('period')
    if (schoolYear) filter.schoolYear = schoolYear
    if (period) filter.period = period

    const cards = await ReportCard.find(filter).sort({ rank: 1 }).lean()
    return NextResponse.json({ success: true, data: cards })
  } catch (error) {
    console.error('❌ [API] GET /api/classes/[id]/report-cards:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des bulletins' },
      { status: 500 }
    )
  }
}
