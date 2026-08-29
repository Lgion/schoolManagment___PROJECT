import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const Group = require('../../_/models/ai/Group')
const User = require('../../_/models/ai/User')

/**
 * POST /api/groups/join
 * Permet à un utilisateur de rejoindre un groupe grâce au code d'invitation.
 */
export async function POST(request) {
  try {
    const userId = await requireAuth(request, 'POST /api/groups/join')
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const body = await request.json()
    const { invitationCode } = body

    if (!invitationCode) {
      return NextResponse.json(
        { error: "Le code d'invitation est requis" },
        { status: 400 }
      )
    }

    // Trouver le groupe correspondant au code
    const group = await Group.findOne({ invitationCode: invitationCode.toUpperCase().trim() })
    if (!group) {
      return NextResponse.json(
        { error: 'Groupe introuvable avec ce code d\'invitation' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est déjà membre
    const isMember = group.members.some(m => m.userId === userId)
    if (isMember) {
      return NextResponse.json(
        { error: 'Vous êtes déjà membre de ce groupe', data: group },
        { status: 200 } // Retourne 200 car l'effet final est désiré
      )
    }

    // Récupérer le type d'utilisateur du membre (TEACHER, STUDENT, PARENT, ADMIN)
    const user = await User.findOne({ clerkId: userId })
    let userType = 'STUDENT'
    if (user) {
      if (user.role === 'admin') userType = 'ADMIN'
      else if (user.role === 'prof') userType = 'TEACHER'
      else if (user.role === 'eleve') userType = 'STUDENT'
      else userType = 'PARENT'
    }

    // Ajouter le membre
    group.members.push({
      userId,
      role: 'MEMBER',
      userType
    })

    await group.save()

    return NextResponse.json({
      success: true,
      message: 'Groupe rejoint avec succès',
      data: group
    })

  } catch (error) {
    console.error('Erreur POST /api/groups/join:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'adhésion au groupe' },
      { status: 500 }
    )
  }
}
