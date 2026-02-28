// API RESTful pour les classes
import dbConnect from '../../lib/dbConnect';
import Classe from '../../_/models/ai/Classe';
import { NextResponse } from 'next/server';
import { checkRole, Roles } from '../../../../utils/roles';

import { auth } from '@clerk/nextjs/server';
import User from '../../_/models/ai/User';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isAdmin = await checkRole(Roles.ADMIN);
    const isTeacher = await checkRole(Roles.TEACHER);

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();

    if (isAdmin) {
      const classes = await Classe.find();
      return NextResponse.json(classes);
    }

    // Teacher flow: filter classes by assigned teacher
    const user = await User.findOne({ clerkId: userId }).populate('roleData.teacherRef');
    if (!user || user.role !== 'prof' || !user.roleData?.teacherRef) {
      return NextResponse.json({ error: 'Profil enseignant non trouvé' }, { status: 404 });
    }

    const teacherId = user.roleData.teacherRef._id;

    // Filter classes assigned to the teacher and omit financial/administrative data
    const classes = await Classe.find({ professeur: teacherId })
      .select('-compositions -moyenne_trimetriel -coefficients');

    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des classes', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await checkRole(Roles.ADMIN))) {
      return NextResponse.json({ error: 'Accès refusé (Admin requis)' }, { status: 403 });
    }
    await dbConnect();
    const body = await request.json();

    // Strict Server Validation
    if (!body.annee || !body.niveau || !body.alias) {
      return NextResponse.json({ error: 'Données invalides : champs requis manquants.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{4}$/.test(body.annee)) {
      return NextResponse.json({ error: 'Format d\'année invalide (attendu: YYYY-YYYY).' }, { status: 400 });
    }
    console.log('📝 POST /api/school_ai/classes - Body reçu:', body);
    const created = await Classe.create(body);
    console.log('✅ Classe créée avec succès:', created);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la classe:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json({ error: 'Erreur lors de la création de la classe', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await checkRole(Roles.ADMIN))) {
      return NextResponse.json({ error: 'Accès refusé (Admin requis)' }, { status: 403 });
    }
    await dbConnect();
    const body = await request.json();

    // Strict Server Validation
    if (!body._id) {
      return NextResponse.json({ error: 'L\'ID de la classe est requis pour la mise à jour.' }, { status: 400 });
    }
    if (body.annee && !/^\d{4}-\d{4}$/.test(body.annee)) {
      return NextResponse.json({ error: 'Format d\'année invalide (attendu: YYYY-YYYY).' }, { status: 400 });
    }

    const updated = await Classe.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la classe' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!(await checkRole(Roles.ADMIN))) {
      return NextResponse.json({ error: 'Accès refusé (Admin requis)' }, { status: 403 });
    }
    await dbConnect();
    const body = await request.json();

    // Utiliser findOneAndDelete pour déclencher le middleware de nettoyage
    const deleted = await Classe.findOneAndDelete({ _id: body._id });

    if (!deleted) {
      return NextResponse.json({ error: 'Classe non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la classe' }, { status: 500 });
  }
}
