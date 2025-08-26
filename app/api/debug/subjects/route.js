import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
const Subject = require('../../_/models/ai/Subject');

/**
 * GET /api/debug/subjects
 * Endpoint de debug pour voir toutes les matières en JSON (sans authentification)
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Récupérer TOUTES les matières (même inactives)
    const allSubjects = await Subject.find({}).sort({ nom: 1 });
    const activeSubjects = await Subject.find({ isActive: true }).sort({ nom: 1 });
    const totalCount = await Subject.countDocuments();

    return NextResponse.json({
      success: true,
      debug: {
        totalCount,
        activeCount: activeSubjects.length,
        inactiveCount: totalCount - activeSubjects.length,
        connectionStatus: 'OK',
        timestamp: new Date().toISOString()
      },
      data: {
        all: allSubjects.map(s => ({
          _id: s._id,
          nom: s.nom,
          code: s.code,
          couleur: s.couleur,
          niveaux: s.niveaux,
          dureeDefaut: s.dureeDefaut,
          isActive: s.isActive,
          createdAt: s.createdAt
        })),
        active: activeSubjects.map(s => ({
          _id: s._id,
          nom: s.nom,
          code: s.code,
          couleur: s.couleur,
          niveaux: s.niveaux,
          dureeDefaut: s.dureeDefaut
        }))
      }
    });

  } catch (error) {
    console.error('Erreur debug subjects:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      debug: {
        connectionStatus: 'ERROR',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
