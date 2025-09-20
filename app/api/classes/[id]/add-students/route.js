import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Classe from '../../../_/models/ai/Classe';
import Eleve from '../../../_/models/ai/Eleve';

export async function PATCH(request, { params }) {
  const { id } = await params;
  
  try {
    await dbConnect();
    
    const { studentIds } = await request.json();
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'élèves invalide' },
        { status: 400 }
      );
    }

    console.log(`📚 Ajout de ${studentIds.length} élève(s) à la classe ${id}`);

    // 1. Vérifier que la classe existe
    const classe = await Classe.findById(id);
    if (!classe) {
      return NextResponse.json(
        { error: 'Classe introuvable' },
        { status: 404 }
      );
    }

    // 2. Retirer ces élèves de leurs classes actuelles (s'ils en ont)
    const elevesAvecClasse = await Eleve.find({
      _id: { $in: studentIds },
      current_classe: { $exists: true, $ne: null }
    });

    if (elevesAvecClasse.length > 0) {
      console.log(`📝 ${elevesAvecClasse.length} élève(s) à transférer depuis d'autres classes`);
      
      // Retirer les élèves de leurs anciennes classes
      const anciennesClasses = [...new Set(elevesAvecClasse.map(e => e.current_classe))];
      
      await Classe.updateMany(
        { _id: { $in: anciennesClasses } },
        { $pull: { eleves: { $in: studentIds } } }
      );
      
      console.log(`✅ Élèves retirés de leurs anciennes classes`);
    }

    // 3. Ajouter les élèves à la nouvelle classe
    const updatedClasse = await Classe.findByIdAndUpdate(
      id,
      { 
        $addToSet: { eleves: { $each: studentIds } }
      },
      { new: true, runValidators: true }
    );

    // 4. Mettre à jour le current_classe de tous les élèves
    const updateResult = await Eleve.updateMany(
      { _id: { $in: studentIds } },
      { $set: { current_classe: id } }
    );

    console.log(`✅ ${updateResult.modifiedCount} élève(s) mis à jour avec la nouvelle classe`);

    // 5. Récupérer les infos des élèves ajoutés pour le message de confirmation
    const elevesAjoutes = await Eleve.find(
      { _id: { $in: studentIds } },
      'nom prenoms'
    );

    const message = `${studentIds.length} élève(s) ajouté(s) avec succès à ${classe.niveau} ${classe.alias}`;
    
    return NextResponse.json({
      success: true,
      message,
      classe: updatedClasse,
      elevesAjoutes: elevesAjoutes.map(e => ({
        _id: e._id,
        nom: `${e.nom} ${e.prenoms?.join(' ') || ''}`
      })),
      stats: {
        total: studentIds.length,
        transferes: elevesAvecClasse.length,
        nouveaux: studentIds.length - elevesAvecClasse.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des élèves:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'ajout des élèves',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
