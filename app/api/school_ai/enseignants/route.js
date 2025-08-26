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
    const updated = await Teacher.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'enseignant' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    await Teacher.findByIdAndDelete(body._id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'enseignant' }, { status: 500 });
  }
}
