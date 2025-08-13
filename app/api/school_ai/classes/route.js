// API RESTful pour les classes
import dbConnect from '../../lib/dbConnect';
import Classe from '../../_/models/ai/Classe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const classes = await Classe.find();
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des classes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const created = await Classe.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la classe' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const updated = await Classe.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la classe' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    await Classe.findByIdAndDelete(body._id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la classe' }, { status: 500 });
  }
}
