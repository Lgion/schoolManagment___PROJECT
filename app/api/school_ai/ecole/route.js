// API RESTful pour les paramètres de l'école (frais, config globale)
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import SchoolSettings from '../../_/models/ai/SchoolSettings';
import { checkRole, Roles } from '../../../../utils/roles';
import { authWithFallback } from '../../lib/authWithFallback';

export async function GET(request) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/school_ai/ecole');
    if (!authResult.success) return authResult.response;

    const isAdmin = await checkRole(Roles.ADMIN, request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé (Admin requis)' }, { status: 403 });
    }

    await dbConnect();
    const settings = await SchoolSettings.findOne({ schoolKey: 'default' });

    return NextResponse.json({
      feeDefinitions: settings?.feeDefinitions ?? [],
    });
  } catch (error) {
    console.error('❌ GET /api/school_ai/ecole:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const isAdmin = await checkRole(Roles.ADMIN, request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé (Admin requis)' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const { feeDefinitions } = body;

    if (!Array.isArray(feeDefinitions)) {
      return NextResponse.json({ error: 'feeDefinitions doit être un tableau' }, { status: 400 });
    }

    const updated = await SchoolSettings.findOneAndUpdate(
      { schoolKey: 'default' },
      { feeDefinitions, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ feeDefinitions: updated.feeDefinitions });
  } catch (error) {
    console.error('❌ PUT /api/school_ai/ecole:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
