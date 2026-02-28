// GET /api/school_ai/eleves/[id]/history — Historique complet d'un élève (Admin-only)
// Story 1.5 : Consultation de l'Historique Inaltérable
import dbConnect from '../../../../lib/dbConnect';
import Eleve from '../../../../_/models/ai/Eleve';
import Classe from '../../../../_/models/ai/Classe';
import { NextResponse } from 'next/server';
import { Roles } from '../../../../../../utils/roles';
import { auth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
    try {
        // Pattern Story 1.3/1.4 — single auth() call
        const { userId, sessionClaims } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;

        // Task 1.2: Admin ONLY — aucun autre rôle
        if (userRole !== Roles.ADMIN) {
            return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        await dbConnect();

        const { id } = params;
        const eleve = await Eleve.findById(id).lean();

        if (!eleve) {
            return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
        }

        // Task 1.4: Résoudre les classes historiques (bolobi_class_history)
        const classeHistory = eleve['bolobi_class_history_$_ref_µ_classes'] || {};
        const classeIds = Object.values(classeHistory).filter(Boolean);

        let classeNames = {};
        if (classeIds.length > 0) {
            try {
                const classes = await Classe.find({ _id: { $in: classeIds } })
                    .select('_id niveau alias annee')
                    .lean();
                classes.forEach(c => {
                    classeNames[c._id.toString()] = `${c.niveau || ''} ${c.alias || ''}`.trim() || c._id.toString();
                });
            } catch (err) {
                console.error('Erreur résolution classes historiques:', err);
                // Non bloquant — continuer sans résolution
            }
        }

        // Construire le classeHistory résolu avec noms
        const classeHistoryResolved = {};
        Object.entries(classeHistory).forEach(([annee, classeId]) => {
            classeHistoryResolved[annee] = {
                _id: classeId?.toString(),
                nom: classeId ? (classeNames[classeId.toString()] || classeId.toString()) : null,
            };
        });

        // Task 1.3: Retourner uniquement les champs historiques (Admin-only)
        return NextResponse.json({
            _id: eleve._id,
            nom: eleve.nom,
            prenoms: eleve.prenoms,
            sexe: eleve.sexe,
            // Données historiques pédagogiques
            compositions: eleve.compositions || {},
            notes: eleve.notes || {},
            absences: eleve.absences || [],
            school_history: eleve.school_history || {},
            bolobi_class_history: classeHistoryResolved,
            // Données financières — Admin-only (défense en profondeur)
            scolarity_fees: eleve['scolarity_fees_$_checkbox'] || {},
        });

    } catch (error) {
        console.error('Erreur GET /api/school_ai/eleves/[id]/history:', error);
        return NextResponse.json({
            error: 'Erreur lors de la récupération de l\'historique',
            details: error.message
        }, { status: 500 });
    }
}
