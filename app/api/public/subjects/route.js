import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
const Subject = require('../../_/models/ai/Subject');

/**
 * GET /api/public/subjects
 * Route publique temporaire pour récupérer les matières (sans authentification)
 * À utiliser pendant le développement
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const niveau = searchParams.get('niveau');
    
    // Filtre par niveau si spécifié
    const filter = { isActive: true };
    if (niveau) {
      filter.$or = [
        { niveaux: niveau },
        { niveaux: "ALL" }
      ];
    }

    const subjects = await Subject.find(filter).sort({ nom: 1 });

    return NextResponse.json({
      success: true,
      data: subjects,
      count: subjects.length,
      message: `${subjects.length} matières trouvées`
    });

  } catch (error) {
    console.error('Erreur GET /api/public/subjects:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 });
  }
}
