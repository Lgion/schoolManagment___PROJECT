// API Route pour lister les fichiers dans Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import cloudinaryService from '../../../../services/cloudinaryService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    // Vérification de l'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupération des paramètres
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const tags = searchParams.get('tags');
    const maxResults = searchParams.get('maxResults');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    console.log('📁 List request:', {
      folder,
      tags,
      maxResults,
      entityType,
      entityId
    });

    let result;

    // Recherche par tags ou listing par dossier
    if (tags) {
      const tagArray = tags.split(',').filter(Boolean);
      result = await cloudinaryService.searchByTags(tagArray, {
        maxResults: maxResults ? parseInt(maxResults) : 30
      });
    } else if (folder) {
      result = await cloudinaryService.listFiles(folder, {
        maxResults: maxResults ? parseInt(maxResults) : 30
      });
    } else {
      // Si pas de dossier spécifié, utiliser le type d'entité
      let targetFolder = cloudinaryService.folders.documents;
      
      if (entityType) {
        targetFolder = cloudinaryService.folders[
          entityType === 'eleve' ? 'eleves' :
          entityType === 'enseignant' ? 'enseignants' :
          entityType === 'classe' ? 'classes' : 'documents'
        ];
        
        // Si un ID d'entité est fourni, chercher dans le sous-dossier spécifique
        if (entityId) {
          targetFolder = `${targetFolder}/${entityId}`;
        }
      }
      
      result = await cloudinaryService.listFiles(targetFolder, {
        maxResults: maxResults ? parseInt(maxResults) : 30
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la récupération des fichiers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: result.data,
      totalCount: result.totalCount
    });

  } catch (error) {
    console.error('❌ Erreur listing:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des fichiers' },
      { status: 500 }
    );
  }
}
