import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Classe from '../../../_/models/ai/Classe';

export async function POST(request, { params }) {
  const { id } = await params;
  
  try {
    await dbConnect();
    
    const { targetYear } = await request.json();
    
    if (!targetYear) {
      return NextResponse.json(
        { error: 'Année cible requise' },
        { status: 400 }
      );
    }

    console.log(`📋 Duplication de la classe ${id} vers l'année ${targetYear}`);

    // 1. Vérifier que la classe source existe
    const sourceClasse = await Classe.findById(id);
    if (!sourceClasse) {
      return NextResponse.json(
        { error: 'Classe source introuvable' },
        { status: 404 }
      );
    }

    // 2. Vérifier qu'une classe avec le même niveau et alias n'existe pas déjà pour l'année cible
    const existingClasse = await Classe.findOne({
      niveau: sourceClasse.niveau,
      alias: sourceClasse.alias,
      annee: targetYear
    });

    if (existingClasse) {
      return NextResponse.json(
        { 
          error: `Une classe ${sourceClasse.niveau} ${sourceClasse.alias} existe déjà pour l'année ${targetYear}` 
        },
        { status: 409 }
      );
    }

    // 3. Créer la nouvelle classe (sans élèves ni enseignants)
    const newClasseData = {
      niveau: sourceClasse.niveau,
      alias: sourceClasse.alias,
      annee: targetYear,
      description: sourceClasse.description,
      photo: sourceClasse.photo || "", // Copier la photo ou chaîne vide
      homework: sourceClasse.homework || {},
      compositions: sourceClasse.compositions || [],
      coefficients: sourceClasse.coefficients || {},
      moyenne_trimetriel: sourceClasse.moyenne_trimetriel || ["", "", ""],
      commentaires: sourceClasse.commentaires || [],
      schedules: [], // Nouveau tableau vide pour les horaires
      cloudinary: sourceClasse.cloudinary || null,
      // Ne pas copier eleves et professeur (enseignants)
      eleves: [],
      professeur: []
    };

    const newClasse = await Classe.create(newClasseData);

    console.log(`✅ Classe dupliquée avec succès:`, {
      sourceId: sourceClasse._id,
      newId: newClasse._id,
      niveau: newClasse.niveau,
      alias: newClasse.alias,
      sourceYear: sourceClasse.annee,
      targetYear: newClasse.annee
    });

    return NextResponse.json({
      success: true,
      message: `Classe ${newClasse.niveau} ${newClasse.alias} dupliquée avec succès pour l'année ${targetYear}`,
      sourceClasse: {
        _id: sourceClasse._id,
        niveau: sourceClasse.niveau,
        alias: sourceClasse.alias,
        annee: sourceClasse.annee
      },
      newClasse: {
        _id: newClasse._id,
        niveau: newClasse.niveau,
        alias: newClasse.alias,
        annee: newClasse.annee,
        eleves: newClasse.eleves,
        professeur: newClasse.professeur
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la duplication de la classe:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la duplication de la classe',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
