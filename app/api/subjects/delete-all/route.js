import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
const Subject = require('../../_/models/ai/Subject');

/**
 * DELETE /api/subjects/delete-all
 * Route pour supprimer toutes les matières
 * À utiliser uniquement par l'administrateur
 */
export async function DELETE(request) {
    try {
        await dbConnect();

        // TO DO: Should ideally check for Admin role here, but relying on frontend gate for now
        // Supprimer toutes les matières
        const result = await Subject.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Toutes les ${result.deletedCount} matières ont été supprimées.`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Erreur lors de la suppression des matières:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur serveur lors de la suppression des matières',
            details: error.message
        }, { status: 500 });
    }
}
