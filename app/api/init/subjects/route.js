import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
const Subject = require('../../_/models/ai/Subject');

/**
 * POST /api/init/subjects
 * Route d'initialisation publique pour créer les matières par défaut
 * À utiliser uniquement lors de la première configuration
 */
export async function POST(request) {
  try {
    await dbConnect();

    // Vérifier si des matières existent déjà
    const existingSubjects = await Subject.countDocuments();
    if (existingSubjects > 0) {
      return NextResponse.json({
        success: false,
        error: `${existingSubjects} matières existent déjà. Base déjà initialisée.`,
        count: existingSubjects
      }, { status: 400 });
    }

    // Matières par défaut pour école primaire française
    const defaultSubjects = [
      // Matières générales (toutes classes)
      {
        nom: 'Mathématiques',
        code: 'MATH',
        couleur: '#3498db',
        niveaux: false, // Général
        dureeDefaut: 60
      },
      {
        nom: 'Français',
        code: 'FRAN',
        couleur: '#e74c3c',
        niveaux: false, // Général
        dureeDefaut: 60
      },
      {
        nom: 'Sciences et Technologie',
        code: 'SCI',
        couleur: '#2ecc71',
        niveaux: false, // Général
        dureeDefaut: 45
      },
      {
        nom: 'Éducation Physique et Sportive',
        code: 'EPS',
        couleur: '#e67e22',
        niveaux: false, // Général
        dureeDefaut: 60
      },
      {
        nom: 'Arts Plastiques',
        code: 'ART',
        couleur: '#f1c40f',
        niveaux: false, // Général
        dureeDefaut: 45
      },
      {
        nom: 'Éducation Musicale',
        code: 'MUS',
        couleur: '#8e44ad',
        niveaux: false, // Général
        dureeDefaut: 45
      },
      {
        nom: 'Calcul Mental',
        code: 'CALC',
        couleur: '#16a085',
        niveaux: false, // Général
        dureeDefaut: 15
      },
      {
        nom: 'Étude Dirigée',
        code: 'ETUD',
        couleur: '#2c3e50',
        niveaux: false, // Général
        dureeDefaut: 60
      },
      {
        nom: 'Enseignement Moral et Civique',
        code: 'EMC',
        couleur: '#9b59b6',
        niveaux: false, // Général
        dureeDefaut: 30
      },
      {
        nom: 'Récréation',
        code: 'REC',
        couleur: '#f39c12',
        niveaux: false, // Général
        dureeDefaut: 15
      },
      
      // Matières spécifiques à certains niveaux
      {
        nom: 'Histoire-Géographie',
        code: 'HIST',
        couleur: '#f39c12',
        niveaux: ['CE2', 'CM1', 'CM2'], // Spécifique
        dureeDefaut: 45
      },
      {
        nom: 'Anglais',
        code: 'ANG',
        couleur: '#1abc9c',
        niveaux: ['CE1', 'CE2', 'CM1', 'CM2'], // Spécifique
        dureeDefaut: 45
      },
      {
        nom: 'Lecture',
        code: 'LECT',
        couleur: '#95a5a6',
        niveaux: ['CP', 'CE1', 'CE2'], // Spécifique
        dureeDefaut: 30
      },
      {
        nom: 'Écriture',
        code: 'ECR',
        couleur: '#7f8c8d',
        niveaux: ['CP', 'CE1', 'CE2'], // Spécifique
        dureeDefaut: 30
      }
    ];

    // Debug : Vérifier le schéma du modèle
    console.log('🔍 Schéma Subject niveaux:', Subject.schema.paths.niveaux)
    console.log('🔍 Premier sujet à créer:', JSON.stringify(defaultSubjects[0], null, 2))
    
    // Créer les matières une par une pour debug
    const createdSubjects = []
    for (const subjectData of defaultSubjects) {
      try {
        console.log(`📝 Création de ${subjectData.nom} avec niveaux:`, subjectData.niveaux)
        const subject = new Subject(subjectData)
        await subject.validate() // Validation explicite
        const saved = await subject.save()
        createdSubjects.push(saved)
        console.log(`✅ ${subjectData.nom} créé avec succès`)
      } catch (err) {
        console.error(`❌ Erreur pour ${subjectData.nom}:`, err.message)
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      data: createdSubjects,
      message: `🎉 Initialisation réussie ! ${createdSubjects.length} matières primaires créées`,
      count: createdSubjects.length,
      subjects: createdSubjects.map(s => ({ nom: s.nom, code: s.code, niveaux: s.niveaux.length }))
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'initialisation des matières:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de l\'initialisation des matières',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/init/subjects
 * Vérifier l'état d'initialisation (route publique)
 */
export async function GET(request) {
  try {
    await dbConnect();

    const existingCount = await Subject.countDocuments();
    const subjects = await Subject.find({}, 'nom code niveaux isActive').sort({ nom: 1 });

    return NextResponse.json({
      success: true,
      data: {
        isInitialized: existingCount > 0,
        subjectCount: existingCount,
        subjects: subjects.map(s => ({
          nom: s.nom,
          code: s.code,
          niveaux: s.niveaux.length,
          isActive: s.isActive
        }))
      },
      message: existingCount > 0 
        ? `Base initialisée avec ${existingCount} matières` 
        : 'Base non initialisée - aucune matière trouvée'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la vérification',
      details: error.message
    }, { status: 500 });
  }
}
