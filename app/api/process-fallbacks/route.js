import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

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

    // Récupérer les paramètres de query
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dry') === 'true';
    const force = searchParams.get('force') === 'true';
    const limit = searchParams.get('limit');

    console.log('🚀 [API] Lancement du script process-cloudinary-fallbacks...');
    console.log('📋 Paramètres:', { dryRun, force, limit });

    // Construire les arguments du script
    const scriptPath = path.join(process.cwd(), 'scripts', 'process-cloudinary-fallbacks.js');
    const args = [];
    
    if (dryRun) {
      args.push('--dry-run');
    }
    
    if (force) {
      args.push('--force');
    }
    
    if (limit && !isNaN(parseInt(limit))) {
      args.push(`--limit=${limit}`);
    }

    // Exécuter le script en tant que processus enfant
    return new Promise((resolve) => {
      const child = spawn('node', [scriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      // Capturer la sortie standard
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('[SCRIPT]', chunk.trim());
      });

      // Capturer les erreurs
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.error('[SCRIPT ERROR]', chunk.trim());
      });

      // Gérer la fin du processus
      child.on('close', (code) => {
        console.log(`🏁 [API] Script terminé avec le code: ${code}`);
        
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Script exécuté avec succès',
            output: output,
            parameters: { dryRun, force, limit }
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Erreur lors de l\'exécution du script',
            error: errorOutput,
            output: output,
            exitCode: code
          }, { status: 500 }));
        }
      });

      // Gérer les erreurs de lancement
      child.on('error', (error) => {
        console.error('❌ [API] Erreur lors du lancement du script:', error);
        resolve(NextResponse.json({
          success: false,
          message: 'Impossible de lancer le script',
          error: error.message
        }, { status: 500 }));
      });

      // Timeout de sécurité (5 minutes)
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve(NextResponse.json({
            success: false,
            message: 'Script interrompu (timeout de 5 minutes)',
            output: output
          }, { status: 408 }));
        }
      }, 5 * 60 * 1000);
    });

  } catch (error) {
    console.error('❌ [API] Erreur générale:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    }, { status: 500 });
  }
}
