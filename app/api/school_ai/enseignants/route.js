// API RESTful pour les enseignants
import dbConnect from '../../lib/dbConnect';
import Teacher from '../../_/models/ai/Teacher';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const enseignants = await Teacher.find();
    return NextResponse.json(enseignants);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des enseignants' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log('🔍 DEBUG API POST - Données reçues:', body);
    console.log('🔍 DEBUG API POST - Type current_classes:', typeof body.current_classes);
    console.log('🔍 DEBUG API POST - Valeur current_classes:', body.current_classes);
    console.log('🔍 DEBUG API POST - Est un array?', Array.isArray(body.current_classes));
    
    const created = await Teacher.create(body);
    console.log('🔍 DEBUG API POST - Données sauvegardées:', created);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('❌ Erreur création enseignant:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'enseignant' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Utiliser .save() pour déclencher les middlewares de synchronisation
    const teacher = await Teacher.findById(body._id);
    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 });
    }
    
    console.log('🔍 DEBUG API: Avant modification - current_classes:', teacher.current_classes);
    console.log('🔍 DEBUG API: Nouvelles current_classes:', body.current_classes);
    console.log('🔍 DEBUG API: naissance_$_date reçue:', body.naissance_$_date, typeof body.naissance_$_date);
    
    // Capturer l'ancienne valeur avant modification pour le middleware
    teacher._original = teacher.toObject();
    
    // Convertir la date de naissance si elle est en format string
    if (body.naissance_$_date && typeof body.naissance_$_date === 'string') {
      const timestamp = new Date(body.naissance_$_date).getTime();
      if (!isNaN(timestamp)) {
        body.naissance_$_date = timestamp;
        console.log('🔍 DEBUG API: Date convertie en timestamp:', timestamp);
      } else {
        console.log('❌ DEBUG API: Date invalide, conversion échouée');
      }
    }
    
    // Mettre à jour les propriétés
    Object.assign(teacher, body);
    
    // Forcer la détection de modification si current_classes a changé
    const oldClasses = teacher._original.current_classes || [];
    const newClasses = body.current_classes || [];
    const hasChanged = JSON.stringify(oldClasses.sort()) !== JSON.stringify(newClasses.sort());
    
    if (hasChanged) {
      teacher.markModified('current_classes');
      console.log('🔍 DEBUG API: current_classes marqué comme modifié');
      console.log('🔍 DEBUG API: Anciennes classes:', oldClasses);
      console.log('🔍 DEBUG API: Nouvelles classes:', newClasses);
    }
    
    // Sauvegarder (déclenche les middlewares)
    console.log('🔍 DEBUG API: Avant save(), current_classes:', teacher.current_classes);
    const updated = await teacher.save();
    console.log('🔍 DEBUG API: Après save(), middleware devrait se déclencher');
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enseignant:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'enseignant' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Utiliser findOneAndDelete pour déclencher les middlewares de nettoyage
    const deleted = await Teacher.findOneAndDelete({ _id: body._id });
    
    if (!deleted) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enseignant:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'enseignant' }, { status: 500 });
  }
}
