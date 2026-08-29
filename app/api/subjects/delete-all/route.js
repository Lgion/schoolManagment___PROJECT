import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import { requireAuth } from '../../lib/authWithFallback';
import { checkRole, Roles } from '../../../../utils/roles';
const Subject = require('../../_/models/ai/Subject');

/**
 * DELETE /api/subjects/delete-all
 * Route pour supprimer toutes les matières
 * À utiliser uniquement par l'administrateur
 */
export async function DELETE(request) {
    try {
        // Sécurité : opération destructive réservée aux administrateurs
        const auth = await requireAuth(request, 'DELETE /api/subjects/delete-all');
        if (auth instanceof NextResponse) return auth;

        const isAdmin = await checkRole(Roles.ADMIN, request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Accès refusé - réservé aux administrateurs' },
                { status: 403 }
            );
        }

        await dbConnect();

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
