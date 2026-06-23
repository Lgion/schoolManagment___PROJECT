import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'

const mongoose = require('mongoose')
const Eleve = require('../../../_/models/ai/Eleve')
const User = require('../../../_/models/ai/User')

// Validation e-mail légère (ou vide pour « effacer »).
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const isEmailOrEmpty = (v) => v === '' || EMAIL_RE.test(v)

/**
 * PATCH /api/students/{id}/account
 * Configure les clés de correspondance qui permettent à l'élève et/ou à ses
 * parents de créer leur compte (le rôle est attribué automatiquement à la
 * connexion via le webhook Clerk + determineUserRole) :
 *   - studentEmail / studentPhone : compte autonome de l'élève
 *   - parentEmail (→ parents.email) : compte famille (rattache la fratrie)
 * Réservé au personnel (admin / prof). N'altère QUE ces champs (pas current_classe),
 * via findByIdAndUpdate → le middleware de synchro de classe n'est pas déclenché.
 */
export async function PATCH(request, { params }) {
  try {
    const userId = await requireAuth(request, 'PATCH /api/students/[id]/account')
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    // Garde : personnel uniquement.
    const me = await User.findOne({ clerkId: userId })
    const isStaff = me?.role === 'admin' || me?.role === 'prof'
    // En mode démo/sample (falsy → user_fake_admin_123, pas de doc User), on autorise (= admin).
    const demoAdmin = userId === 'user_fake_admin_123'
    if (!isStaff && !demoAdmin) {
      return NextResponse.json({ success: false, error: 'Accès réservé au personnel' }, { status: 403 })
    }

    const body = await request.json()
    const { studentEmail, studentPhone, parentEmail } = body || {}

    const set = {}
    if (studentEmail !== undefined) {
      const v = String(studentEmail).trim().toLowerCase()
      if (!isEmailOrEmpty(v)) return NextResponse.json({ success: false, error: 'E-mail élève invalide' }, { status: 400 })
      set.studentEmail = v
    }
    if (studentPhone !== undefined) {
      set.studentPhone = String(studentPhone).trim()
    }
    if (parentEmail !== undefined) {
      const v = String(parentEmail).trim().toLowerCase()
      if (!isEmailOrEmpty(v)) return NextResponse.json({ success: false, error: 'E-mail parent invalide' }, { status: 400 })
      set['parents.email'] = v
    }

    if (Object.keys(set).length === 0) {
      return NextResponse.json({ success: false, error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const updated = await Eleve.findByIdAndUpdate(id, { $set: set }, { new: true })
      .select('nom prenoms studentEmail studentPhone parents')
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Élève introuvable' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: updated._id,
        studentEmail: updated.studentEmail || '',
        studentPhone: updated.studentPhone || '',
        parentEmail: updated.parents?.email || '',
      },
    })
  } catch (error) {
    console.error('❌ [API] PATCH /api/students/[id]/account:', error)
    return NextResponse.json({ success: false, error: "Erreur lors de la configuration de l'accès" }, { status: 500 })
  }
}
