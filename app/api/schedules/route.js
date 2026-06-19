import { NextResponse } from 'next/server'
import { requireAuth } from '../lib/authWithFallback'
import dbConnect from '../lib/dbConnect'

// Import dynamique pour les modèles Mongoose
const Schedule = require('../_/models/ai/Schedule')
const { getActiveSchedule, getScheduleHistory } = require('../../../utils/scheduleHelpers')

/**
 * GET /api/schedules
 * Récupère les emplois du temps selon les paramètres
 */
export async function GET(request) {
  try {
    // Authentification avec fallback robuste
    const userId = await requireAuth(request, 'GET /api/schedules')

    // Si requireAuth retourne une NextResponse, c'est une erreur d'auth
    if (userId instanceof NextResponse) {
      return userId
    }

    await dbConnect()

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
    // Authentification avec fallback robuste
    const userId = await requireAuth(request, 'POST /api/schedules')

    // Si requireAuth retourne une NextResponse, c'est une erreur d'auth
    if (userId instanceof NextResponse) {
      return userId
    }

    await dbConnect()

    const body = await request.json()
    const { classeId, label, validFrom, validUntil } = body

    // Nouveau format `events` privilégié ; `planning` accepté en rétro-compat
    // (converti en events) tant que d'anciens clients existent.
    const { planningToEvents, validateEvents } = require('../../../utils/scheduleEvents')
    let events = Array.isArray(body.events) ? body.events : null
    if (!events && body.planning) {
      events = planningToEvents(body.planning)
    }

    if (!classeId || !events) {
      return NextResponse.json(
        { error: '"classeId" et "events" (ou "planning") sont requis' },
        { status: 400 }
      )
    }

    const validation = validateEvents(events)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Emploi du temps invalide', details: validation.errors },
        { status: 400 }
      )
    }

    // ÉTAPE 1: Archiver tous les emplois du temps actifs de cette classe
    console.log('📚 Archivage des emplois du temps précédents pour la classe:', classeId)
    
    const archivedCount = await Schedule.updateMany(
      { 
        classeId: classeId,
        isArchived: false // Seulement les emplois du temps actifs
      },
      { 
        $set: { 
          isArchived: true 
        },
        $push: {
          modifications: {
            userId,
            action: "archived",
            details: { reason: "Nouveau emploi du temps créé" }
          }
        }
      }
    )
    
    console.log(`✅ ${archivedCount.modifiedCount} emploi(s) du temps archivé(s)`)

    // ÉTAPE 2: Créer le nouvel emploi du temps (qui sera actif par défaut)
    const newSchedule = new Schedule({
      classeId,
      label: label || undefined, // Utilise le default du schéma si non fourni
      events,
      validFrom: validFrom || undefined,
      validUntil: validUntil || null,
      createdBy: userId,
      isArchived: false, // Explicitement actif
      modifications: [{
        userId,
        action: "created",
        details: {} // Sera rempli par le helper si nécessaire
      }]
    })

    const savedSchedule = await newSchedule.save()
    console.log('✅ Nouvel emploi du temps créé et activé:', savedSchedule._id)

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
