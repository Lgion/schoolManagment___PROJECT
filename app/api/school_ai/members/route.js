// API RESTful pour les membres
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({done: "fichier écrit ;)"});
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des membres' }, { status: 500 });
  }
}
