// API RESTful pour les paramètres de l'école (frais, targets, config globale)
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import SchoolSettings from '../../_/models/ai/SchoolSettings';
import Eleve from '../../_/models/ai/Eleve';
import { checkRole, Roles } from '../../../../utils/roles';
import { authWithFallback } from '../../lib/authWithFallback';

export async function GET(request) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/school_ai/ecole');
    if (!authResult.success) return authResult.response;

    const isAdmin = await checkRole(Roles.ADMIN, request);
    const isTeacher = await checkRole(Roles.TEACHER, request);

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();
    const settings = await SchoolSettings.findOne({ schoolKey: 'default' });

    return NextResponse.json({
      feeDefinitions: settings?.feeDefinitions ?? [],
      targets: settings?.targets ?? [],
      homepage: settings?.homepage ?? { title: '', texts: [], photo: '' },
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
    const updateFields = { updatedAt: new Date() };

    // Handle feeDefinitions update
    if (body.feeDefinitions !== undefined) {
      if (!Array.isArray(body.feeDefinitions)) {
        return NextResponse.json({ error: 'feeDefinitions doit être un tableau' }, { status: 400 });
      }
      updateFields.feeDefinitions = body.feeDefinitions;
    }

    // Handle targets update
    if (body.targets !== undefined) {
      if (!Array.isArray(body.targets)) {
        return NextResponse.json({ error: 'targets doit être un tableau' }, { status: 400 });
      }
      updateFields.targets = body.targets;
    }

    // Handle homepage update
    if (body.homepage !== undefined) {
      updateFields.homepage = body.homepage;
    }

    // Handle cascade delete: if a target key was removed, clean all students
    if (body.removedTargetKey) {
      const key = body.removedTargetKey;
      await Eleve.updateMany(
        { [`targetsList.${key}`]: { $exists: true } },
        { $unset: { [`targetsList.${key}`]: "" } }
      );
      console.log(`🧹 Nettoyage cascade: clé "${key}" retirée de tous les élèves.`);
    }

    const updated = await SchoolSettings.findOneAndUpdate(
      { schoolKey: 'default' },
      updateFields,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      feeDefinitions: updated.feeDefinitions,
      targets: updated.targets,
      homepage: updated.homepage,
    });
  } catch (error) {
    console.error('❌ PUT /api/school_ai/ecole:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
