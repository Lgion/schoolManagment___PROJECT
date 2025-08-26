/**
 * Script de migration des matières vers la base de données
 * Convertit utils/matieres.js vers le modèle Subject
 */

import { MATIERES_SCOLAIRES } from './matieres.js'

/**
 * Génère un code unique pour une matière
 * @param {String} nom - Nom de la matière
 * @returns {String} - Code généré (ex: "MATH", "FRAN")
 */
const generateSubjectCode = (nom) => {
  // Supprime les accents et caractères spéciaux, garde que les lettres
  const normalized = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
  
  // Prend les 4 premières lettres ou le mot entier si plus court
  return normalized.substring(0, Math.min(4, normalized.length))
}

/**
 * Génère une couleur aléatoire pour une matière
 * @returns {String} - Couleur hexadécimale
 */
const generateRandomColor = () => {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400',
    '#8e44ad', '#27ae60', '#2980b9', '#c0392b', '#16a085'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Convertit les matières du fichier utils/matieres.js vers le format Subject
 * @returns {Array} - Tableau des matières formatées pour la DB
 */
export const convertMatieresToSubjects = () => {
  const usedCodes = new Set()
  
  return MATIERES_SCOLAIRES.map(nom => {
    let code = generateSubjectCode(nom)
    
    // Assure l'unicité du code
    let counter = 1
    while (usedCodes.has(code)) {
      code = generateSubjectCode(nom) + counter
      counter++
    }
    usedCodes.add(code)
    
    return {
      nom,
      code,
      couleur: generateRandomColor(),
      niveaux: ["ALL"], // Applicable à tous les niveaux par défaut
      dureeDefaut: 60, // 1 heure par défaut
      isActive: true
    }
  })
}

/**
 * Script de migration à exécuter une seule fois
 * Insère les matières dans la base de données
 */
export const migrateSubjectsToDatabase = async () => {
  try {
    const Subject = require('../app/api/_/models/ai/Subject')
    
    // Vérifie si des matières existent déjà
    const existingSubjects = await Subject.find({})
    
    if (existingSubjects.length > 0) {
      console.log('⚠️ Des matières existent déjà dans la base de données')
      console.log(`Nombre de matières existantes: ${existingSubjects.length}`)
      return existingSubjects
    }
    
    // Convertit et insère les matières
    const subjectsData = convertMatieresToSubjects()
    const insertedSubjects = await Subject.insertMany(subjectsData)
    
    console.log('✅ Migration des matières réussie')
    console.log(`${insertedSubjects.length} matières insérées`)
    
    return insertedSubjects
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des matières:', error)
    throw error
  }
}

/**
 * Matières spécifiques par niveau (pour usage futur)
 */
export const MATIERES_PAR_NIVEAU = {
  CP: ['Mathématiques', 'Français', 'Éveil au milieu', 'Éducation Physique', 'Arts Plastiques'],
  CE1: ['Mathématiques', 'Français', 'Éveil au milieu', 'Éducation Physique', 'Arts Plastiques', 'Musique'],
  CE2: ['Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences de la Vie et de la Terre', 'Éducation Physique', 'Arts Plastiques', 'Musique'],
  CM1: ['Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences de la Vie et de la Terre', 'Anglais', 'Éducation Physique', 'Arts Plastiques', 'Musique'],
  CM2: ['Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences de la Vie et de la Terre', 'Anglais', 'Éducation Physique', 'Arts Plastiques', 'Musique', 'Informatique']
}
