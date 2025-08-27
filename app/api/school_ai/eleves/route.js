// API RESTful pour les élèves
import dbConnect from '../../lib/dbConnect';
import Eleve from '../../_/models/ai/Eleve';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const eleves = await Eleve.find();
    return NextResponse.json(eleves);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des élèves' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log('REQ.BODY ELEVE:', body);
    const created = await Eleve.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de l\'élève' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Utiliser .save() pour déclencher les middlewares de synchronisation
    const eleve = await Eleve.findById(body._id);
    if (!eleve) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
    }

    console.log("111oooooooooooooooooooooooooooooooo");
    console.log(body.current_classe);
    console.log(eleve.current_classe);
    console.log("222oooooooooooooooooooooooooooooooo");
    
    // Capturer l'ancienne valeur avant modification pour le middleware
    eleve._original = eleve.toObject();
    
    // Mettre à jour les propriétés
    Object.assign(eleve, body);
    
    // Forcer la détection de modification si current_classe a changé
    if (body.current_classe && body.current_classe !== eleve._original.current_classe?.toString()) {
      eleve.markModified('current_classe');
      console.log('🔍 DEBUG API: current_classe marqué comme modifié');
      console.log('🔍 DEBUG API: Ancienne classe:', eleve._original.current_classe);
      console.log('🔍 DEBUG API: Nouvelle classe:', body.current_classe);
    }
    
    // Sauvegarder (déclenche les middlewares)
    console.log('🔍 DEBUG API: Avant save(), current_classe:', eleve.current_classe)
    const updated = await eleve.save()
    console.log('🔍 DEBUG API: Après save(), middleware devrait se déclencher')
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'élève:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'élève' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Utiliser findOneAndDelete pour déclencher les middlewares de nettoyage
    const deleted = await Eleve.findOneAndDelete({ _id: body._id });
    
    if (!deleted) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'élève:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'élève' }, { status: 500 });
  }
}
