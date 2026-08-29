import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/authWithFallback'
import dbConnect from '../../../../lib/dbConnect'

const Classe = require('../../../../_/models/ai/Classe')
const ClassBook = require('../../../../_/models/ai/ClassBook')
const StudentBook = require('../../../../_/models/ai/StudentBook')
const User = require('../../../../_/models/ai/User')

/**
 * POST /api/classes/[id]/classbook/student-books
 * Crée ou met à jour le yearbook personnalisé (StudentBook) d'un élève.
 */
export async function POST(request, { params }) {
  const { id: classId } = await params;
  try {
    const userId = await requireAuth(request, `POST /api/classes/${classId}/classbook/student-books`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const classe = await Classe.findById(classId)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const { studentId, personalizedPdfUrl } = body

    if (!studentId || !personalizedPdfUrl) {
      return NextResponse.json({ error: 'studentId et personalizedPdfUrl requis' }, { status: 400 })
    }

    // Trouver le classbook
    const schoolYear = classe.annee || '2025-2026'
    let classBook = await ClassBook.findOne({ classId, schoolYear })
    if (!classBook) {
      return NextResponse.json({ error: 'Livre de classe global introuvable. Veuillez l\'initialiser d\'abord.' }, { status: 400 })
    }

    // Créer ou mettre à jour le StudentBook
    let studentBook = await StudentBook.findOne({ studentId, classBookId: classBook._id })

    if (studentBook) {
      studentBook.personalizedPdfUrl = personalizedPdfUrl
      await studentBook.save()
    } else {
      studentBook = await StudentBook.create({
        studentId,
        classBookId: classBook._id,
        personalizedPdfUrl
      })
    }

    return NextResponse.json({
      success: true,
      data: studentBook
    })

  } catch (error) {
    console.error('Erreur POST /api/classes/[id]/classbook/student-books:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la sauvegarde du livre élève' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/classes/[id]/classbook/student-books
 * Récupère tous les StudentBooks pour le livre de classe actuel.
 */
export async function GET(request, { params }) {
  const { id: classId } = await params;
  try {
    const userId = await requireAuth(request, `GET /api/classes/${classId}/classbook/student-books`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const classe = await Classe.findById(classId)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const schoolYear = classe.annee || '2025-2026'
    const classBook = await ClassBook.findOne({ classId, schoolYear })
    if (!classBook) {
      return NextResponse.json({ success: true, data: [] })
    }

    const studentBooks = await StudentBook.find({ classBookId: classBook._id })

    return NextResponse.json({
      success: true,
      data: studentBooks
    })

  } catch (error) {
    console.error('Erreur GET /api/classes/[id]/classbook/student-books:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement des livres élèves' },
      { status: 500 }
    )
  }
}
