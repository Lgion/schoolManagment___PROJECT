import { NextResponse } from 'next/server'
import { requireAuth } from '../lib/authWithFallback'
import dbConnect from '../lib/dbConnect'

const Group = require('../_/models/ai/Group')
const User = require('../_/models/ai/User')

// Fonction utilitaire pour générer un code d'invitation unique
function generateInvitationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * GET /api/groups
 * Liste tous les groupes dont l'utilisateur connecté fait partie (créateur ou membre).
 */
export async function GET(request) {
  try {
    const userId = await requireAuth(request, 'GET /api/groups')
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const mockRole = cookieStore.get('mock_role')?.value

    let query = {
      $or: [
        { creatorId: userId },
        { 'members.userId': userId }
      ]
    }

    // Application du filtre visuel pour le mode Bac à Sable (simulation de rôle)
    if (userId === 'user_fake_admin_123' && mockRole) {
      if (mockRole === 'eleve') {
        query = { 'members.userType': 'STUDENT' };
      } else if (mockRole === 'prof') {
        query = { 'members.userType': 'TEACHER' };
      } else if (mockRole === 'parent') {
        query = { 'members.userType': 'PARENT' };
      } else {
        query = {}; // admin voit tout
      }
    }

    const groups = await Group.find(query).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: groups
    })
  } catch (error) {
    console.error('Erreur GET /api/groups:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des groupes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/groups
 * Crée un nouveau groupe.
 */
export async function POST(request) {
  try {
    const userId = await requireAuth(request, 'POST /api/groups')
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const body = await request.json()
    const { name, description, isPrivate, features, initialMembers } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du groupe est requis' },
        { status: 400 }
      )
    }

    // Récupérer le type d'utilisateur du créateur (TEACHER, STUDENT, PARENT, ADMIN)
    const creatorUser = await User.findOne({ clerkId: userId })
    let creatorUserType = 'STUDENT'
    if (creatorUser) {
      if (creatorUser.role === 'admin') creatorUserType = 'ADMIN'
      else if (creatorUser.role === 'prof') creatorUserType = 'TEACHER'
      else if (creatorUser.role === 'eleve') creatorUserType = 'STUDENT'
      else creatorUserType = 'PARENT'
    }

    // Générer un code d'invitation unique
    let invitationCode = generateInvitationCode()
    let codeExists = await Group.findOne({ invitationCode })
    while (codeExists) {
      invitationCode = generateInvitationCode()
      codeExists = await Group.findOne({ invitationCode })
    }

    // Préparer les membres : ajouter le créateur comme ADMIN
    const membersList = [{
      userId: userId,
      role: 'ADMIN',
      userType: creatorUserType
    }]

    // Ajouter des membres initiaux s'il y en a
    if (Array.isArray(initialMembers)) {
      for (const m of initialMembers) {
        if (m.userId && m.userId !== userId) {
          membersList.push({
            userId: m.userId,
            role: m.role || 'MEMBER',
            userType: m.userType || 'STUDENT'
          })
        }
      }
    }

    const newGroup = new Group({
      name,
      description: description || '',
      creatorId: userId,
      members: membersList,
      isPrivate: isPrivate !== false,
      invitationCode,
      features: {
        chat: features?.chat !== false,
        wall: features?.wall !== false,
        fileSharing: features?.fileSharing !== false,
        ...features
      }
    })

    const savedGroup = await newGroup.save()

    return NextResponse.json({
      success: true,
      data: savedGroup
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/groups:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du groupe' },
      { status: 500 }
    )
  }
}
