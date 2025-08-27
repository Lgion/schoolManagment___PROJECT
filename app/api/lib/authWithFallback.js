import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Authentification robuste avec fallback JWT pour Clerk
 * 
 * Cette fonction gère l'authentification de manière robuste en utilisant :
 * 1. La méthode standard auth() de Clerk
 * 2. Un fallback de décodage JWT manuel depuis les headers si auth() échoue
 * 
 * @param {Request} request - L'objet Request de NextJS
 * @param {string} context - Contexte pour les logs (ex: "POST /api/schedules")
 * @returns {Object} - { success: boolean, userId: string|null, response: NextResponse|null }
 */
export async function authWithFallback(request, context = 'API') {
  try {
    // Récupérer les headers d'authentification Clerk
    const authStatus = request.headers.get('x-clerk-auth-status')
    const authToken = request.headers.get('x-clerk-auth-token')
    
    console.log(`🔐 Authentification ${context}:`)
    console.log('  - authStatus:', authStatus)
    console.log('  - authToken présent:', !!authToken)
    
    let userId = null
    
    // ÉTAPE 1: Essayer d'abord la méthode standard auth()
    try {
      const authResult = auth()
      userId = authResult.userId
      console.log('  - userId (auth()):', userId)
    } catch (authError) {
      console.log('  - Erreur auth():', authError.message)
    }
    
    // ÉTAPE 2: Si auth() échoue, essayer de décoder le token manuellement
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
    
    // ÉTAPE 3: Validation finale
    if (!userId || authStatus !== 'signed-in') {
      console.log('❌ Utilisateur non authentifié')
      console.log('  - userId final:', userId)
      console.log('  - authStatus:', authStatus)
      
      return {
        success: false,
        userId: null,
        response: NextResponse.json(
          { error: 'Non autorisé - Utilisateur non connecté' },
          { status: 401 }
        )
      }
    }
    
    console.log('✅ Utilisateur authentifié:', userId)
    
    return {
      success: true,
      userId,
      response: null
    }
    
  } catch (error) {
    console.error(`❌ Erreur d'authentification ${context}:`, error)
    
    return {
      success: false,
      userId: null,
      response: NextResponse.json(
        { error: 'Erreur serveur lors de l\'authentification' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware d'authentification pour les routes API
 * 
 * Utilise authWithFallback et retourne directement une réponse d'erreur si l'auth échoue
 * 
 * @param {Request} request - L'objet Request de NextJS
 * @param {string} context - Contexte pour les logs
 * @returns {Promise<string|NextResponse>} - userId si succès, NextResponse si échec
 */
export async function requireAuth(request, context = 'API') {
  const authResult = await authWithFallback(request, context)
  
  if (!authResult.success) {
    return authResult.response
  }
  
  return authResult.userId
}

/**
 * Version simplifiée pour les cas où on veut juste récupérer l'userId
 * sans gestion d'erreur automatique
 * 
 * @param {Request} request - L'objet Request de NextJS
 * @returns {Promise<string|null>} - userId si authentifié, null sinon
 */
export async function getUserId(request) {
  const authResult = await authWithFallback(request, 'getUserId')
  return authResult.userId
}
