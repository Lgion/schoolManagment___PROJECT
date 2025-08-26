import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../lib/dbConnect';
const Subject = require('../../_/models/ai/Subject');

/**
 * PUT /api/subjects/[id]
 * Modifier une matière existante
 * Accessible aux admins et profs uniquement
 */
export async function PUT(request, { params }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { nom, code, couleur, niveaux, dureeDefaut } = body;

    // Validation des données requises
    if (!nom || !code) {
      return NextResponse.json(
        { success: false, error: 'Nom et code sont requis' },
        { status: 400 }
      );
    }

    // Validation des niveaux (false ou array de classes valides)
    if (niveaux !== undefined && niveaux !== false) {
      if (!Array.isArray(niveaux)) {
        return NextResponse.json(
          { success: false, error: 'niveaux doit être false (général) ou un array de classes' },
          { status: 400 }
        );
      }
      const validClasses = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
      if (!niveaux.every(classe => validClasses.includes(classe))) {
        return NextResponse.json(
          { success: false, error: 'Classes invalides. Utilisez: CP, CE1, CE2, CM1, CM2' },
          { status: 400 }
        );
      }
    }

    // Vérifier que la matière existe
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier l'unicité (exclure la matière actuelle)
    const duplicateSubject = await Subject.findOne({
      _id: { $ne: id },
      $or: [{ nom }, { code: code.toUpperCase() }]
    });

    if (duplicateSubject) {
      return NextResponse.json(
        { success: false, error: 'Une autre matière avec ce nom ou ce code existe déjà' },
        { status: 409 }
      );
    }

    // Mettre à jour la matière
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      {
        nom,
        code: code.toUpperCase(),
        couleur: couleur || existingSubject.couleur,
        niveaux: niveaux || existingSubject.niveaux,
        dureeDefaut: dureeDefaut || existingSubject.dureeDefaut
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedSubject,
      message: 'Matière modifiée avec succès'
    });

  } catch (error) {
    console.error('Erreur PUT /api/subjects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subjects/[id]
 * Supprimer une matière
 * Accessible aux admins et profs uniquement
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;

    // Vérifier que la matière existe
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    // TODO: Vérifier si la matière est utilisée dans des emplois du temps
    // Pour l'instant, on permet la suppression directe

    // Supprimer la matière
    await Subject.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Matière "${existingSubject.nom}" supprimée avec succès`
    });

  } catch (error) {
    console.error('Erreur DELETE /api/subjects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subjects/[id]
 * Récupérer une matière spécifique
 */
export async function GET(request, { params }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const subject = await Subject.findById(id);

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subject
    });

  } catch (error) {
    console.error('Erreur GET /api/subjects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
