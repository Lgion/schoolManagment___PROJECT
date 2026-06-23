import { NextResponse } from 'next/server'
import { authWithFallback } from '../lib/authWithFallback'
import dbConnect from '../lib/dbConnect'

const mongoose = require('mongoose')
const Conversation = require('../_/models/ai/Conversation')
const Message = require('../_/models/ai/Message')
const User = require('../_/models/ai/User')
// Eleve/Teacher importés pour enregistrer leurs schémas (populate des refs).
require('../_/models/ai/Eleve')
require('../_/models/ai/Teacher')

const TYPES = ['STUDENT_TEACHER', 'PARENT_TEACHER']

/**
 * GET /api/conversations
 * Liste les conversations où le demandeur figure dans `participants`.
 * Query optionnelle :
 *   - studentRef : limite aux conversations concernant cet élève
 *   - type       : STUDENT_TEACHER | PARENT_TEACHER
 * Chaque conversation est enrichie de `unreadCount` (messages non lus, hors les siens).
 */
export async function GET(request) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/conversations')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const studentRef = searchParams.get('studentRef')
    const type = searchParams.get('type')

    const filter = { participants: me }
    if (studentRef && mongoose.Types.ObjectId.isValid(studentRef)) filter.studentRef = studentRef
    if (type && TYPES.includes(type)) filter.conversationType = type

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .populate('studentRef', 'nom prenoms')
      .populate('teacherRef', 'nom prenoms')
      .lean()

    // unreadCount par conversation (data faible volume — acceptable en MVP).
    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: me },
          readBy: { $ne: me },
        })
        return { ...c, unreadCount }
      })
    )

    return NextResponse.json({ success: true, data: withUnread })
  } catch (error) {
    console.error('❌ [API] GET /api/conversations:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des conversations' }, { status: 500 })
  }
}

/**
 * POST /api/conversations
 * Démarre (ou récupère, idempotent) une conversation.
 * Body : { conversationType, studentRef, teacherRef }
 *
 * Résolution des participants (clerkIds) :
 *   - teacherClerkId : User lié à `teacherRef` (roleData.teacherRef). 409 sinon.
 *   - familyClerkId  : si le demandeur n'est PAS le prof, c'est lui (élève ou
 *     parent connecté) ; si le prof initie, on résout l'élève (eleveRef) ou un
 *     parent (childrenRefs) à partir de `studentRef`. 409 si pas de compte.
 */
export async function POST(request) {
  try {
    const authResult = await authWithFallback(request, 'POST /api/conversations')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const body = await request.json()
    const { conversationType, studentRef, teacherRef } = body || {}

    if (!TYPES.includes(conversationType)) {
      return NextResponse.json({ success: false, error: 'conversationType invalide' }, { status: 400 })
    }
    if (!studentRef || !mongoose.Types.ObjectId.isValid(studentRef)) {
      return NextResponse.json({ success: false, error: 'studentRef invalide' }, { status: 400 })
    }
    if (!teacherRef || !mongoose.Types.ObjectId.isValid(teacherRef)) {
      return NextResponse.json({ success: false, error: 'teacherRef invalide' }, { status: 400 })
    }

    // 1. clerkId du professeur
    const teacherUser = await User.findOne({ 'roleData.teacherRef': teacherRef })
    if (!teacherUser) {
      return NextResponse.json(
        { success: false, error: "Ce professeur n'a pas encore de compte : conversation impossible." },
        { status: 409 }
      )
    }
    const teacherClerkId = teacherUser.clerkId

    // 2. clerkId du côté famille (élève ou parent)
    let familyClerkId
    if (me !== teacherClerkId) {
      // Le demandeur est l'élève / le parent connecté.
      familyClerkId = me
    } else {
      // Le prof initie : résoudre le destinataire à partir de l'élève.
      const recipient =
        conversationType === 'STUDENT_TEACHER'
          ? await User.findOne({ 'roleData.eleveRef': studentRef })
          : await User.findOne({ 'roleData.childrenRefs': studentRef })
      if (!recipient) {
        return NextResponse.json(
          { success: false, error: "Le destinataire n'a pas encore de compte : conversation impossible." },
          { status: 409 }
        )
      }
      familyClerkId = recipient.clerkId
    }

    const participants = [...new Set([teacherClerkId, familyClerkId])]

    // 3. Idempotence : réutiliser une conversation existante du même type/élève/prof.
    let conversation = await Conversation.findOne({
      conversationType,
      studentRef,
      teacherRef,
      participants: { $all: participants },
    })

    let created = false
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        conversationType,
        studentRef,
        teacherRef,
      })
      created = true
    }

    await conversation.populate([
      { path: 'studentRef', select: 'nom prenoms' },
      { path: 'teacherRef', select: 'nom prenoms' },
    ])

    return NextResponse.json({ success: true, data: conversation }, { status: created ? 201 : 200 })
  } catch (error) {
    console.error('❌ [API] POST /api/conversations:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la création de la conversation' }, { status: 500 })
  }
}
