/**
 * Helpers pour la gestion des emplois du temps
 * Conversion entre formats et logique métier
 */

/**
 * Convertit l'objet simplifié en structure planning complète
 * @param {Object} details - Objet simplifié des modifications
 * @returns {Object} - Structure planning complète
 */
const convertDetailsToPlanning = (details) => {
  const planning = {
    lundi: [],
    mardi: [],
    mercredi: [],
    jeudi: [],
    vendredi: [],
    samedi: []
  }
  
  Object.keys(details).forEach(jour => {
    if (planning.hasOwnProperty(jour) && Array.isArray(details[jour])) {
      planning[jour] = details[jour].map(slot => ({
        heureDebut: slot.debut,
        heureFin: slot.fin,
        subjectId: slot.matiere,
        notes: slot.notes || ""
      }))
    }
  })
  
  return planning
}

/**
 * Convertit le planning complet en représentation simplifiée
 * @param {Object} planning - Structure planning complète
 * @returns {Object} - Représentation simplifiée
 */
const convertPlanningToDetails = (planning) => {
  const details = {}
  
  Object.keys(planning).forEach(jour => {
    if (planning[jour] && Array.isArray(planning[jour]) && planning[jour].length > 0) {
      details[jour] = planning[jour].map(slot => ({
        debut: slot.heureDebut,
        fin: slot.heureFin,
        matiere: slot.subjectId,
        notes: slot.notes || ""
      }))
    }
  })
  
  return details
}

/**
 * Récupère l'emploi du temps actif pour une classe
 * Le plus récent non archivé est considéré comme actif
 * @param {String} classeId - ID de la classe
 * @returns {Object|null} - Emploi du temps actif ou null
 */
const getActiveSchedule = async (classeId) => {
  try {
    const Schedule = require('../app/api/_/models/ai/Schedule')
    const schedules = await Schedule.find({
      classeId,
      isArchived: false
    })
    .populate('planning.lundi.subjectId planning.mardi.subjectId planning.mercredi.subjectId planning.jeudi.subjectId planning.vendredi.subjectId planning.samedi.subjectId')
    .sort({ createdAt: -1 })
    .limit(1)
    
    return schedules[0] || null
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps actif:', error)
    return null
  }
}

/**
 * Archive un emploi du temps
 * @param {String} scheduleId - ID de l'emploi du temps
 * @param {String} userId - ID de l'utilisateur (clerkId)
 * @returns {Object} - Emploi du temps archivé
 */
const archiveSchedule = async (scheduleId, userId) => {
  try {
    const Schedule = require('../app/api/_/models/ai/Schedule')
    const schedule = await Schedule.findById(scheduleId)
    
    if (!schedule) {
      throw new Error('Emploi du temps non trouvé')
    }
    
    if (schedule.isArchived) {
      throw new Error('Cet emploi du temps est déjà archivé')
    }
    
    // Ajouter l'action d'archivage dans l'historique
    schedule.modifications.push({
      userId,
      action: "archived",
      details: convertPlanningToDetails(schedule.planning)
    })
    
    schedule.isArchived = true
    
    return await schedule.save()
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error)
    throw error
  }
}

/**
 * Réactive un emploi du temps archivé
 * IMPORTANT: Archive automatiquement tous les autres emplois du temps actifs de la même classe
 * @param {String} scheduleId - ID de l'emploi du temps
 * @param {String} userId - ID de l'utilisateur (clerkId)
 * @returns {Object} - Emploi du temps réactivé
 */
const reactivateSchedule = async (scheduleId, userId) => {
  try {
    const Schedule = require('../app/api/_/models/ai/Schedule')
    const schedule = await Schedule.findById(scheduleId)
    
    if (!schedule) {
      throw new Error('Emploi du temps non trouvé')
    }
    
    if (!schedule.isArchived) {
      throw new Error('Cet emploi du temps n\'est pas archivé')
    }

    // ÉTAPE 1: Archiver tous les emplois du temps actifs de cette classe
    console.log('📚 Archivage des emplois du temps actifs pour la classe:', schedule.classeId)
    
    const archivedCount = await Schedule.updateMany(
      { 
        classeId: schedule.classeId,
        isArchived: false,
        _id: { $ne: scheduleId } // Exclure l'emploi du temps qu'on réactive
      },
      { 
        $set: { 
          isArchived: true 
        },
        $push: {
          modifications: {
            userId,
            action: "archived",
            details: { reason: "Emploi du temps réactivé" }
          }
        }
      }
    )
    
    console.log(`✅ ${archivedCount.modifiedCount} emploi(s) du temps archivé(s) automatiquement`)

    // ÉTAPE 2: Réactiver l'emploi du temps sélectionné
    schedule.modifications.push({
      userId,
      action: "reactivated",
      details: convertPlanningToDetails(schedule.planning)
    })
    
    schedule.isArchived = false
    
    const reactivatedSchedule = await schedule.save()
    console.log('✅ Emploi du temps réactivé:', reactivatedSchedule._id)
    
    return reactivatedSchedule
  } catch (error) {
    console.error('Erreur lors de la réactivation:', error)
    throw error
  }
}

/**
 * Récupère l'historique des emplois du temps pour une classe
 * @param {String} classeId - ID de la classe
 * @param {Boolean} includeArchived - Inclure les emplois du temps archivés
 * @returns {Array} - Liste des emplois du temps
 */
const getScheduleHistory = async (classeId, includeArchived = true) => {
  try {
    const filter = { classeId }
    if (!includeArchived) {
      filter.isArchived = false
    }
    
    const Schedule = require('../app/api/_/models/ai/Schedule')
    const schedules = await Schedule.find(filter)
      .sort({ createdAt: -1 })
      .populate('planning.lundi.subjectId planning.mardi.subjectId planning.mercredi.subjectId planning.jeudi.subjectId planning.vendredi.subjectId planning.samedi.subjectId')
    
    return schedules
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return []
  }
}

/**
 * Valide la cohérence d'un planning
 * @param {Object} planning - Structure planning à valider
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePlanning = (planning) => {
  const errors = []
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  
  jours.forEach(jour => {
    if (planning[jour] && Array.isArray(planning[jour])) {
      const slots = planning[jour]
      
      // Vérifier les chevauchements d'horaires
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = slots[i]
          const slot2 = slots[j]
          
          if (isTimeOverlap(slot1.heureDebut, slot1.heureFin, slot2.heureDebut, slot2.heureFin)) {
            errors.push(`Chevauchement d'horaires le ${jour} entre ${slot1.heureDebut}-${slot1.heureFin} et ${slot2.heureDebut}-${slot2.heureFin}`)
          }
        }
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Vérifie si deux créneaux horaires se chevauchent
 * @param {String} start1 - Heure de début du premier créneau
 * @param {String} end1 - Heure de fin du premier créneau
 * @param {String} start2 - Heure de début du second créneau
 * @param {String} end2 - Heure de fin du second créneau
 * @returns {Boolean} - True si chevauchement
 */
const isTimeOverlap = (start1, end1, start2, end2) => {
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)
  
  return start1Min < end2Min && start2Min < end1Min
}

/**
 * Génère un label par défaut pour un emploi du temps
 * @param {String} niveau - Niveau de la classe (ex: "CM1")
 * @param {Date} date - Date de création
 * @returns {String} - Label généré
 */
const generateDefaultLabel = (niveau, date = new Date()) => {
  const dateStr = date.toLocaleDateString('fr-FR')
  return `Emploi du temps ${niveau} - ${dateStr}`
}

// Exports CommonJS
module.exports = {
  convertDetailsToPlanning,
  convertPlanningToDetails,
  getActiveSchedule,
  archiveSchedule,
  reactivateSchedule,
  getScheduleHistory,
  validatePlanning,
  generateDefaultLabel
}
