import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Institution from '../../../_/models/ai/Institution';
import SchoolSettings from '../../../_/models/ai/SchoolSettings';
import Classe from '../../../_/models/ai/Classe';
import Eleve from '../../../_/models/ai/Eleve';
import Teacher from '../../../_/models/ai/Teacher';

export async function GET(request) {
  try {
    // Sécuriser l'appel par un secret token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET || 'local_secret_token_123';

    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await dbConnect();

    // 1. Trouver les sandboxes anonymes créées il y a plus de 48 heures (172800000 ms)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // On cible uniquement les sandboxes (isReal: false) qui n'ont jamais été converties (ownerClerkId: null)
    const oldSandboxes = await Institution.find({
      isReal: false,
      ownerClerkId: null,
      createdAt: { $lt: cutoffTime }
    });

    console.log(`🧹 Found ${oldSandboxes.length} anonymous sandboxes older than 48 hours for cleanup.`);

    const deletedKeys = [];

    // 2. Suppression en cascade pour chaque établissement trouvé
    for (const inst of oldSandboxes) {
      const { schoolKey } = inst;
      console.log(`  -> Purging sandbox data for: ${schoolKey}`);

      // Supprimer les élèves de cette école
      const elevesRes = await Eleve.deleteMany({ schoolKey });
      // Supprimer les enseignants de cette école
      const teachersRes = await Teacher.deleteMany({ schoolKey });
      // Supprimer les classes de cette école
      const classesRes = await Classe.deleteMany({ schoolKey });
      // Supprimer les paramètres de cette école
      const settingsRes = await SchoolSettings.deleteOne({ schoolKey });
      // Supprimer l'institution elle-même
      await Institution.deleteOne({ schoolKey });

      deletedKeys.push({
        schoolKey,
        name: inst.name,
        details: {
          students: elevesRes.deletedCount,
          teachers: teachersRes.deletedCount,
          classes: classesRes.deletedCount,
          settings: settingsRes.deletedCount
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé avec succès. ${deletedKeys.length} établissements purgés.`,
      purged: deletedKeys
    });

  } catch (err) {
    console.error('❌ Cron cleanup task failed:', err);
    return NextResponse.json({ error: 'Erreur lors du nettoyage cron', details: err.message }, { status: 500 });
  }
}
