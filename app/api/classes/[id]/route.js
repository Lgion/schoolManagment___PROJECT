// API pour récupérer une classe spécifique avec ses coefficients
import dbConnect from '../../lib/dbConnect';
import Classe from '../../_/models/ai/Classe';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    console.log('🎓 [API] Récupération de la classe:', id);
    
    const classe = await Classe.findById(id);
    
    if (!classe) {
      console.log('❌ [API] Classe non trouvée:', id);
      return NextResponse.json({ 
        success: false, 
        error: 'Classe non trouvée' 
      }, { status: 404 });
    }
    
    console.log('✅ [API] Classe trouvée:', {
      id: classe._id,
      niveau: classe.niveau,
      hasCoefficients: !!classe.coefficients,
      coefficientsKeys: Object.keys(classe.coefficients || {})
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: classe._id,
        niveau: classe.niveau,
        annee: classe.annee,
        coefficients: classe.coefficients || {},
        // Inclure d'autres propriétés si nécessaire
        eleves: classe.eleves,
        professeur: classe.professeur
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur lors de la récupération de la classe:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération de la classe' 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    // Vérifier que la classe existe d'abord
    const existingClasse = await Classe.findById(id);
    if (!existingClasse) {
      return NextResponse.json({
        success: false,
        error: 'Classe non trouvée'
      }, { status: 404 });
    }

    const updated = await Classe.findByIdAndUpdate(
      id, 
      { $set: { coefficients: body.coefficients } },
      { new: true, runValidators: true }
    );
    
    // findByIdAndUpdate avec { new: true } renvoie déjà le document à jour :
    // pas besoin d'une requête de relecture supplémentaire (N+1).
    return NextResponse.json({
      success: true,
      data: {
        _id: updated._id,
        niveau: updated.niveau,
        coefficients: updated.coefficients
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur lors de la mise à jour des coefficients:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur lors de la mise à jour' 
    }, { status: 500 });
  }
}
