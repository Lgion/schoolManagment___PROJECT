// API RESTful pour l'école
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({done: "fichier écrit ;)"});
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des données école' }, { status: 500 });
  }
}
