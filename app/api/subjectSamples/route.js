import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../lib/dbConnect';
const Subject = require('../_/models/ai/Subject');

/**
 * POST /api/subjectSamples
 * Crée les matières par défaut pour l'école française
 * Accessible uniquement aux administrateurs
 */
export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    await dbConnect();

    // Vérifier si des matières existent déjà
    const existingSubjects = await Subject.countDocuments();
    if (existingSubjects > 0) {
      return NextResponse.json({
        success: false,
        error: `${existingSubjects} matières existent déjà. Supprimez-les d'abord si vous voulez les recréer.`,
        count: existingSubjects
      }, { status: 400 });
    }

    // Matières par défaut pour école française
    const defaultSubjects = [
      {
        nom: 'Mathématiques',
        code: 'MATH',
        couleur: '#3498db',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Français',
        code: 'FRAN',
        couleur: '#e74c3c',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Histoire-Géographie',
        code: 'HIST',
        couleur: '#f39c12',
        niveaux: ['CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Sciences',
        code: 'SCI',
        couleur: '#2ecc71',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 45
      },
      {
        nom: 'SVT',
        code: 'SVT',
        couleur: '#27ae60',
        niveaux: ['6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Physique-Chimie',
        code: 'PHYS',
        couleur: '#9b59b6',
        niveaux: ['5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Anglais',
        code: 'ANG',
        couleur: '#1abc9c',
        niveaux: ['CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 45
      },
      {
        nom: 'Éducation Physique',
        code: 'EPS',
        couleur: '#e67e22',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Arts Plastiques',
        code: 'ART',
        couleur: '#f1c40f',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 45
      },
      {
        nom: 'Musique',
        code: 'MUS',
        couleur: '#8e44ad',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 45
      },
      {
        nom: 'Technologie',
        code: 'TECH',
        couleur: '#34495e',
        niveaux: ['6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      },
      {
        nom: 'Lecture',
        code: 'LECT',
        couleur: '#95a5a6',
        niveaux: ['CP', 'CE1', 'CE2'],
        dureeDefaut: 30
      },
      {
        nom: 'Écriture',
        code: 'ECR',
        couleur: '#7f8c8d',
        niveaux: ['CP', 'CE1', 'CE2'],
        dureeDefaut: 30
      },
      {
        nom: 'Calcul Mental',
        code: 'CALC',
        couleur: '#16a085',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 15
      },
      {
        nom: 'Étude Dirigée',
        code: 'ETUD',
        couleur: '#2c3e50',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        dureeDefaut: 60
      }
    ];

    // Créer les matières en batch
    const createdSubjects = await Subject.insertMany(defaultSubjects);

    return NextResponse.json({
      success: true,
      data: createdSubjects,
      message: `${createdSubjects.length} matières créées avec succès`,
      count: createdSubjects.length
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création des matières par défaut:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création des matières'
    }, { status: 500 });
  }
}

/**
 * GET /api/subjectSamples
 * Retourne les informations sur les matières par défaut disponibles
 */
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    await dbConnect();

    const existingCount = await Subject.countDocuments();
    const totalSamples = 15; // Nombre de matières par défaut

    return NextResponse.json({
      success: true,
      data: {
        existingSubjects: existingCount,
        availableSamples: totalSamples,
        canCreate: existingCount === 0,
        samples: [
          'Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences', 'SVT',
          'Physique-Chimie', 'Anglais', 'EPS', 'Arts Plastiques', 'Musique',
          'Technologie', 'Lecture', 'Écriture', 'Calcul Mental', 'Étude Dirigée'
        ]
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des informations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/subjectSamples
 * Supprime toutes les matières (pour réinitialiser)
 */
export async function DELETE(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    await dbConnect();

    const result = await Subject.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} matières supprimées`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des matières:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    }, { status: 500 });
  }
}
