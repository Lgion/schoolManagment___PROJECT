// API Route pour récupérer les statistiques d'usage Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import cloudinaryService from '@/services/cloudinaryService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    // Vérification de l'authentification (admin uniquement)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // TODO: Vérifier que l'utilisateur est admin
    // const user = await getUserRole(userId);
    // if (user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Accès réservé aux administrateurs' },
    //     { status: 403 }
    //   );
    // }

    console.log('📊 Stats request from user:', userId);

    // Récupération des statistiques
    const result = await cloudinaryService.getUsageStats();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la récupération des statistiques' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: result.data,
      formattedStats: {
        storage: {
          used: formatBytes(result.data.storage.used),
          limit: formatBytes(result.data.storage.limit),
          percentage: `${result.data.storage.percentage.toFixed(1)}%`,
          remaining: formatBytes(result.data.storage.limit - result.data.storage.used)
        },
        bandwidth: {
          used: formatBytes(result.data.bandwidth.used),
          limit: formatBytes(result.data.bandwidth.limit),
          percentage: `${result.data.bandwidth.percentage.toFixed(1)}%`,
          remaining: formatBytes(result.data.bandwidth.limit - result.data.bandwidth.used)
        },
        transformations: result.data.transformations
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

// Fonction helper pour formater les bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
