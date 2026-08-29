import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'
import { checkRole, Roles } from '../../../../utils/roles'

const mongoose = require('mongoose')
const EducationalGame = require('../../_/models/ai/EducationalGame')

/**
 * GET /api/games/{id} — un jeu IA avec son contenu (accès ouvert).
 */
export async function GET(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/games/[id]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const game = await EducationalGame.findById(id).lean()
    if (!game) return NextResponse.json({ success: false, error: 'Jeu non trouvé' }, { status: 404 })

    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error('❌ [API] GET /api/games/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement du jeu' }, { status: 500 })
  }
}

/**
 * DELETE /api/games/{id} — suppression d'un jeu IA (admin/prof uniquement).
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'DELETE /api/games/[id]')
    if (!authResult.success) return authResult.response

    const isAdmin = await checkRole(Roles.ADMIN, request)
    const isTeacher = await checkRole(Roles.TEACHER, request)
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const deleted = await EducationalGame.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Jeu non trouvé' }, { status: 404 })

    return NextResponse.json({ success: true, data: { _id: id } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/games/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
