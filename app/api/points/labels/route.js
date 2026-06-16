import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const PointLabel = require('../../_/models/ai/PointLabel')

/**
 * GET /api/points/labels
 * Récupère la liste des catégories pré-définies de bonus/malus.
 * Query optionnelle : ?type=BONUS|MALUS, ?all=true (inclure les labels inactifs).
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request, 'GET /api/points/labels')
    if (auth instanceof NextResponse) return auth

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const includeInactive = searchParams.get('all') === 'true'

    const filter = {}
    if (!includeInactive) filter.isActive = true
    if (type === 'BONUS' || type === 'MALUS') filter.type = type

    const labels = await PointLabel.find(filter).sort({ type: 1, name: 1 }).lean()

    return NextResponse.json({ success: true, data: labels })
  } catch (error) {
    console.error('❌ [API] GET /api/points/labels:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/points/labels
 * Crée une nouvelle catégorie de bonus/malus.
 * Body : { name, type: "BONUS"|"MALUS", icon?, defaultAmount? }
 * (Hors périmètre strict de la spec mais indispensable pour alimenter les catégories.)
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request, 'POST /api/points/labels')
    if (auth instanceof NextResponse) return auth

    await dbConnect()

    const body = await request.json()
    const { name, type, icon, defaultAmount } = body || {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'name est requis' }, { status: 400 })
    }
    if (type !== 'BONUS' && type !== 'MALUS') {
      return NextResponse.json({ success: false, error: 'type doit être "BONUS" ou "MALUS"' }, { status: 400 })
    }

    const label = await PointLabel.create({
      name: name.trim(),
      type,
      icon: typeof icon === 'string' ? icon : '',
      ...(Number.isInteger(defaultAmount) ? { defaultAmount } : {}),
    })

    return NextResponse.json({ success: true, data: label }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] POST /api/points/labels:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    )
  }
}
