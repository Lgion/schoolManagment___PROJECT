import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Datas } from '../../_/models/Datas';

export async function GET(request) {
  try {
    // Vérifier si on est en localhost
    const isLocalhost = process.env.NODE_ENV === 'development' || 
                       process.env.VERCEL !== '1' || 
                       request.headers.get('host')?.includes('localhost') ||
                       request.headers.get('host')?.includes('127.0.0.1');

    if (!isLocalhost) {
      return NextResponse.json(
        { message: "Action uniquement disponible en local" }, 
        { status: 403 }
      );
    }

    console.log('🗑️ [API] Suppression des fallbacks Cloudinary...');

    // Connexion à MongoDB si pas déjà connectée
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
      await mongoose.connect(MONGODB_URI);
      console.log('🔌 Connecté à MongoDB');
    }

    // Compter les entrées avant suppression
    const countBefore = await Datas.countDocuments({ key: 'cloudinaryFallback' });
    console.log(`📊 Nombre d'entrées cloudinaryFallback trouvées: ${countBefore}`);

    if (countBefore === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune entrée cloudinaryFallback à supprimer',
        deleted: 0,
        details: {
          countBefore: 0,
          countAfter: 0
        }
      });
    }

    // Supprimer toutes les entrées avec key: "cloudinaryFallback"
    const deleteResult = await Datas.removeByKey('cloudinaryFallback');
    console.log(`🗑️ Résultat suppression:`, deleteResult);

    // Vérifier le nombre d'entrées après suppression
    const countAfter = await Datas.countDocuments({ key: 'cloudinaryFallback' });
    console.log(`📊 Nombre d'entrées restantes: ${countAfter}`);

    // Réponse de succès
    return NextResponse.json({
      success: true,
      message: `${deleteResult.deletedCount} entrées cloudinaryFallback supprimées avec succès`,
      deleted: deleteResult.deletedCount,
      details: {
        countBefore,
        countAfter,
        acknowledged: deleteResult.acknowledged
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur lors de la suppression:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la suppression des fallbacks',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
