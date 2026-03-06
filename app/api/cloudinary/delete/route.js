// API Route pour supprimer des fichiers de Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import cloudinaryService from '../../../../services/cloudinaryService';
import { authWithFallback } from '../../lib/authWithFallback';

export async function DELETE(request) {
  try {
    // Vérification de l'authentification
    const authResult = await authWithFallback(request, 'DELETE /api/cloudinary/delete');
    if (!authResult.success) {
      return authResult.response;
    }
    const userId = authResult.userId;

    // Récupération des données
    const body = await request.json();
    const { publicIds, publicId, resourceType = 'image' } = body;

    console.log('🗑️ Delete request:', {
      publicIds,
      publicId,
      resourceType
    });

    if (!publicIds && !publicId) {
      return NextResponse.json(
        { error: 'Aucun fichier à supprimer spécifié' },
        { status: 400 }
      );
    }

    let result;

    // Suppression multiple ou unique
    if (publicIds && Array.isArray(publicIds)) {
      result = await cloudinaryService.deleteMultiple(publicIds);
    } else {
      const idToDelete = publicId || publicIds;
      result = await cloudinaryService.deleteFile(idToDelete, resourceType);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier(s) supprimé(s) avec succès',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
