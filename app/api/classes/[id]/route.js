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
    
    console.log('🔄 [API] Début mise à jour classe:', id);
    console.log('📊 [API] Body reçu:', JSON.stringify(body, null, 2));
    console.log('📊 [API] Coefficients à sauvegarder:', JSON.stringify(body.coefficients, null, 2));
    
    // Vérifier que la classe existe d'abord
    const existingClasse = await Classe.findById(id);
    if (!existingClasse) {
      console.log('❌ [API] Classe non trouvée:', id);
      return NextResponse.json({ 
        success: false, 
        error: 'Classe non trouvée' 
      }, { status: 404 });
    }
    
    console.log('📋 [API] Classe trouvée, coefficients actuels:', existingClasse.coefficients);
    
    const updated = await Classe.findByIdAndUpdate(
      id, 
      { $set: { coefficients: body.coefficients } },
      { new: true, runValidators: true }
    );
    
    console.log('✅ [API] Mise à jour réussie, nouveaux coefficients:', updated.coefficients);
    console.log('🔍 [API] Classe complète après mise à jour:', JSON.stringify(updated, null, 2));
    
    // Vérification supplémentaire : relire la classe depuis la base
    const verification = await Classe.findById(id);
    console.log('🔍 [API] Vérification coefficients en base:', verification.coefficients);
    
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
