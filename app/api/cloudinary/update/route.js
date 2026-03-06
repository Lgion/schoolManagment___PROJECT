// API Route pour mettre à jour des fichiers dans Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import cloudinaryService from '../../../../services/cloudinaryService';
import { authWithFallback } from '../../lib/authWithFallback';

export async function PUT(request) {
  try {
    // Vérification de l'authentification
    const authResult = await authWithFallback(request, 'PUT /api/cloudinary/update');
    if (!authResult.success) {
      return authResult.response;
    }
    const userId = authResult.userId;

    // Récupération des données
    const body = await request.json();
    const { publicId, tags, context } = body;

    console.log('✏️ Update request:', {
      publicId,
      tags,
      context
    });

    if (!publicId) {
      return NextResponse.json(
        { error: 'PublicId requis pour la mise à jour' },
        { status: 400 }
      );
    }

    // Mise à jour du fichier
    const result = await cloudinaryService.updateFile(publicId, {
      tags,
      context: {
        ...context,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier mis à jour avec succès',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
