import { NextResponse } from 'next/server';
import { authWithFallback } from '../../lib/authWithFallback';
import dbConnect from '../../lib/dbConnect';
import User from '../../_/models/ai/User';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const authResult = await authWithFallback(request, 'POST /api/institutions/request');
    if (!authResult.success) {
      return authResult.response;
    }

    const { userId } = authResult;
    const { schoolName, studentCount, address } = await request.json();

    if (!schoolName) {
      return NextResponse.json({ error: 'Le nom de l\'école est requis' }, { status: 400 });
    }

    await dbConnect();

    // 1. Trouver l'utilisateur et mettre à jour son statut de demande
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé en base' }, { status: 404 });
    }

    user.realSchoolStatus = 'pending';
    await user.save();

    // 2. Préparer le courriel de simulation d'approbation
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logPath = path.join(logsDir, 'approval-emails.log');
    const timestamp = new Date().toISOString();

    const emailContent = `
================================================================================
📩 [SIMULATION EMAIL] DEMANDE D'OUVERTURE D'ÉCOLE RÉELLE - ${timestamp}
================================================================================
De : ${user.email} (ID Clerk: ${userId})
Nom de l'utilisateur : ${user.firstName} ${user.lastName}
Établissement demandé : ${schoolName}
Effectif estimé : ${studentCount || 'Non spécifié'} élèves
Adresse physique : ${address || 'Non spécifiée'}

--------------------------------------------------------------------------------
👉 DÉCISION SUPER-ADMINISTRATEUR (Liens d'Action Rapide) :
--------------------------------------------------------------------------------
🟢 ACCEPTER LA DEMANDE :
   http://localhost:3000/api/admin/approve-school?userId=${userId}&schoolName=${encodeURIComponent(schoolName)}

🔴 REFUSER LA DEMANDE :
   http://localhost:3000/api/admin/decline-school?userId=${userId}

================================================================================
`;

    // Écrire dans le fichier de log local
    fs.appendFileSync(logPath, emailContent, 'utf8');
    console.log(`📧 Simulated approval email written to ${logPath}`);

    return NextResponse.json({
      success: true,
      message: 'Demande enregistrée. En attente d\'approbation par le Super-Admin.'
    });

  } catch (err) {
    console.error('❌ Failed to request real school:', err);
    return NextResponse.json({ error: 'Erreur lors de la demande d\'école réelle', details: err.message }, { status: 500 });
  }
}
