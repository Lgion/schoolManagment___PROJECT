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
    const updated = await Eleve.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'élève' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    await Eleve.findByIdAndDelete(body._id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'élève' }, { status: 500 });
  }
}
