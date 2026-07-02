import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const Group = require('../../_/models/ai/Group')
const User = require('../../_/models/ai/User')

/**
 * GET /api/groups/[id]
 * Récupère les détails d'un groupe, avec population du nom des membres depuis la collection User.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `GET /api/groups/${id}`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const group = await Group.findById(id)
    if (!group) {
      return NextResponse.json(
        { error: 'Groupe introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est membre du groupe (ou créateur, ou admin de l'application)
    const isMember = group.members.some(m => m.userId === userId)
    const isCreator = group.creatorId === userId
    
    // Vérifier si l'utilisateur est admin global
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'

    if (!isMember && !isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à accéder à ce groupe' },
        { status: 403 }
      )
    }

    // Populer les noms des membres
    const memberUserIds = group.members.map(m => m.userId)
    const users = await User.find({ clerkId: { $in: memberUserIds } })
    const usersMap = {}
    users.forEach(u => {
      usersMap[u.clerkId] = `${u.firstName} ${u.lastName}`.trim() || u.email
    })

    const populatedMembers = group.members.map(m => ({
      userId: m.userId,
      role: m.role,
      userType: m.userType,
      name: usersMap[m.userId] || 'Utilisateur inconnu'
    }))

    const groupData = group.toObject()
    groupData.members = populatedMembers

    return NextResponse.json({
      success: true,
      data: groupData
    })

  } catch (error) {
    console.error('Erreur GET /api/groups/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du groupe' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/groups/[id]
 * Modifie les paramètres du groupe ou les rôles des membres.
 */
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `PUT /api/groups/${id}`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const group = await Group.findById(id)
    if (!group) {
      return NextResponse.json(
        { error: 'Groupe introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est admin du groupe ou créateur ou admin global
    const userMember = group.members.find(m => m.userId === userId)
    const isGroupAdmin = userMember?.role === 'ADMIN'
    const isCreator = group.creatorId === userId
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'

    if (!isGroupAdmin && !isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce groupe (privilège ADMIN requis)' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, isPrivate, features, members } = body

    if (name) group.name = name
    if (description !== undefined) group.description = description
    if (isPrivate !== undefined) group.isPrivate = isPrivate
    if (features) {
      group.features = {
        ...group.features,
        ...features
      }
    }
    if (members && Array.isArray(members)) {
      group.members = members
    }

    const savedGroup = await group.save()

    return NextResponse.json({
      success: true,
      data: savedGroup
    })

  } catch (error) {
    console.error('Erreur PUT /api/groups/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du groupe' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[id]
 * Supprime un groupe. Seul le créateur ou un administrateur global de l'école peut le faire.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `DELETE /api/groups/${id}`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const group = await Group.findById(id)
    if (!group) {
      return NextResponse.json(
        { error: 'Groupe introuvable' },
        { status: 404 }
      )
    }

    const isCreator = group.creatorId === userId
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce groupe (propriétaire ou admin requis)' },
        { status: 403 }
      )
    }

    // Supprimer également les messages du chat et les posts du mur
    const Post = require('../../_/models/ai/Post')
    const GroupMessage = require('../../_/models/ai/GroupMessage')

    await Post.deleteMany({ groupId: id })
    await GroupMessage.deleteMany({ groupId: id })
    await Group.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Groupe supprimé avec succès ainsi que son historique'
    })

  } catch (error) {
    console.error('Erreur DELETE /api/groups/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du groupe' },
      { status: 500 }
    )
  }
}
