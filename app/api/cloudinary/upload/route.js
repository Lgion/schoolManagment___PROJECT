// API Route pour upload de fichiers vers Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import cloudinaryService from '../../../../services/cloudinaryService';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    // Vérification de l'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupération des données
    const formData = await request.formData();
    const files = formData.getAll('files');
    const entityType = formData.get('entityType'); // eleve, enseignant, classe
    const entityData = JSON.parse(formData.get('entityData') || '{}');
    const tags = JSON.parse(formData.get('tags') || '[]');
    
    console.log('📤 Upload request:', {
      filesCount: files.length,
      entityType,
      entityData,
      tags
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const errors = [];

    // Traiter chaque fichier
    for (const file of files) {
      try {
        // Convertir le fichier en base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Déterminer le type de fichier et les options
        const isImage = file.type.startsWith('image/');
        const publicId = cloudinaryService.generatePublicId(entityType, entityData);
        
        // Options d'upload selon le type
        const uploadOptions = {
          publicId,
          folder: cloudinaryService.folders[entityType === 'eleve' ? 'eleves' : 
                  entityType === 'enseignant' ? 'enseignants' : 
                  entityType === 'classe' ? 'classes' : 'documents'],
          tags: [entityType, ...tags],
          context: {
            entityId: entityData._id || '',
            entityType,
            originalName: file.name,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          },
          isPhoto: isImage && file.name.includes('photo')
        };

        // Upload vers Cloudinary
        const result = await cloudinaryService.uploadFile(base64, uploadOptions);
        
        if (result.success) {
          uploadedFiles.push({
            ...result.data,
            originalName: file.name,
            entityType
          });
        } else {
          errors.push({
            file: file.name,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`❌ Erreur upload ${file.name}:`, error);
        errors.push({
          file: file.name,
          error: error.message
        });
      }
    }

    // Réponse
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier uploadé avec succès', errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Erreur globale upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

// GET - Récupérer la signature pour upload direct depuis le client
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const tags = searchParams.get('tags')?.split(',') || [];

    // Générer la signature pour upload direct
    const signature = await cloudinaryService.generateUploadSignature({
      folder,
      tags,
      context: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      ...signature
    });

  } catch (error) {
    console.error('❌ Erreur génération signature:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de signature' },
      { status: 500 }
    );
  }
}
