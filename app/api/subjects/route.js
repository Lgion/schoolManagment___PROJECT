import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Import dynamique pour les modèles Mongoose
const Subject = require('../_/models/ai/Subject')

/**
 * GET /api/subjects
 * Récupère toutes les matières actives
 */
export async function GET(request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const niveau = searchParams.get('niveau')
    
    // Filtre par niveau si spécifié
    const filter = { isActive: true }
    if (niveau) {
      filter.$or = [
        { niveaux: niveau },
        { niveaux: "ALL" }
      ]
    }

    const subjects = await Subject.find(filter).sort({ nom: 1 })

    return NextResponse.json({
      success: true,
      data: subjects
    })

  } catch (error) {
    console.error('Erreur GET /api/subjects:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subjects
 * Crée une nouvelle matière
 */
export async function POST(request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { nom, code, couleur, niveaux, dureeDefaut } = body

    // Validation des données requises
    if (!nom || !code) {
      return NextResponse.json(
        { success: false, error: 'Nom et code sont requis' },
        { status: 400 }
      )
    }

    // Validation des niveaux (false ou array de classes valides)
    if (niveaux !== undefined && niveaux !== false) {
      if (!Array.isArray(niveaux)) {
        return NextResponse.json(
          { success: false, error: 'niveaux doit être false (général) ou un array de classes' },
          { status: 400 }
        )
      }
      const validClasses = ['CP', 'CE1', 'CE2', 'CM1', 'CM2']
      if (!niveaux.every(classe => validClasses.includes(classe))) {
        return NextResponse.json(
          { success: false, error: 'Classes invalides. Utilisez: CP, CE1, CE2, CM1, CM2' },
          { status: 400 }
        )
      }
    }

    // Vérification de l'unicité
    const existingSubject = await Subject.findOne({
      $or: [{ nom }, { code: code.toUpperCase() }]
    })

    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Une matière avec ce nom ou ce code existe déjà' },
        { status: 409 }
      )
    }

    const newSubject = new Subject({
      nom,
      code: code.toUpperCase(),
      couleur: couleur || "#3498db",
      niveaux: niveaux !== undefined ? niveaux : false,
      dureeDefaut: dureeDefaut || 60
    })

    const savedSubject = await newSubject.save()

    return NextResponse.json({
      success: true,
      data: savedSubject,
      message: 'Matière créée avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/subjects:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
