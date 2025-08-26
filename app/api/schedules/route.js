import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Import dynamique pour les modèles Mongoose
const Schedule = require('../_/models/ai/Schedule')
const { getActiveSchedule, getScheduleHistory } = require('../../../utils/scheduleHelpers')

/**
 * GET /api/schedules
 * Récupère les emplois du temps selon les paramètres
 */
export async function GET(request) {
  try {
    // Méthode alternative pour récupérer l'userId depuis les headers Clerk
    const authStatus = request.headers.get('x-clerk-auth-status')
    const authToken = request.headers.get('x-clerk-auth-token')
    
    console.log('🔐 Authentification GET /api/schedules:')
    console.log('  - authStatus:', authStatus)
    
    let userId = null
    
    // Essayer d'abord la méthode standard
    try {
      const authResult = auth()
      userId = authResult.userId
    } catch (authError) {
      console.log('  - Erreur auth():', authError.message)
    }
    
    // Si auth() échoue, essayer de décoder le token manuellement
    if (!userId && authToken) {
      try {
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]))
        userId = tokenPayload.sub
      } catch (tokenError) {
        console.log('  - Erreur décodage token:', tokenError.message)
      }
    }
    
    if (!userId || authStatus !== 'signed-in') {
      console.log('❌ Utilisateur non authentifié')
      return NextResponse.json(
        { error: 'Non autorisé - Utilisateur non connecté' },
        { status: 401 }
      )
    }
    
    console.log('✅ Utilisateur authentifié:', userId)

    const { searchParams } = new URL(request.url)
    const classeId = searchParams.get('classeId')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const includeArchived = searchParams.get('includeArchived') !== 'false'

    if (!classeId) {
      return NextResponse.json(
        { error: 'classeId est requis' },
        { status: 400 }
      )
    }

    let schedules

    if (activeOnly) {
      // Récupère uniquement l'emploi du temps actif
      const activeSchedule = await getActiveSchedule(classeId)
      schedules = activeSchedule ? [activeSchedule] : []
    } else {
      // Récupère l'historique complet
      schedules = await getScheduleHistory(classeId, includeArchived)
    }

    return NextResponse.json({
      success: true,
      data: schedules
    })

  } catch (error) {
    console.error('Erreur GET /api/schedules:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules
 * Crée un nouvel emploi du temps
 */
export async function POST(request) {
  try {
    // Méthode alternative pour récupérer l'userId depuis les headers Clerk
    const authStatus = request.headers.get('x-clerk-auth-status')
    const authToken = request.headers.get('x-clerk-auth-token')
    
    console.log('🔐 Authentification POST /api/schedules:')
    console.log('  - authStatus:', authStatus)
    console.log('  - authToken présent:', !!authToken)
    
    let userId = null
    
    // Essayer d'abord la méthode standard
    try {
      const authResult = auth()
      userId = authResult.userId
      console.log('  - userId (auth()):', userId)
    } catch (authError) {
      console.log('  - Erreur auth():', authError.message)
    }
    
    // Si auth() échoue, essayer de décoder le token manuellement
    if (!userId && authToken) {
      try {
        // Décoder le JWT pour extraire le sub (userId)
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]))
        userId = tokenPayload.sub
        console.log('  - userId (token décodé):', userId)
      } catch (tokenError) {
        console.log('  - Erreur décodage token:', tokenError.message)
      }
    }
    
    if (!userId || authStatus !== 'signed-in') {
      console.log('❌ Utilisateur non authentifié')
      console.log('  - userId final:', userId)
      console.log('  - authStatus:', authStatus)
      return NextResponse.json(
        { error: 'Non autorisé - Utilisateur non connecté' },
        { status: 401 }
      )
    }
    
    console.log('✅ Utilisateur authentifié:', userId)

    const body = await request.json()
    const { classeId, label, planning, dateDebut, dateFin } = body

    // Validation des données requises
    if (!classeId || !planning || !dateDebut || !dateFin) {
      return NextResponse.json(
        { error: 'classeId, planning, dateDebut et dateFin sont requis' },
        { status: 400 }
      )
    }

    // Validation des dates
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    
    if (debut >= fin) {
      return NextResponse.json(
        { error: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 }
      )
    }

    const newSchedule = new Schedule({
      classeId,
      label: label || undefined, // Utilise le default du schéma si non fourni
      planning,
      dateDebut: debut,
      dateFin: fin,
      createdBy: userId,
      modifications: [{
        userId,
        action: "created",
        details: {} // Sera rempli par le helper si nécessaire
      }]
    })

    const savedSchedule = await newSchedule.save()

    return NextResponse.json({
      success: true,
      data: savedSchedule
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/schedules:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
