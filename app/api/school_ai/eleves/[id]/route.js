// PATCH /api/school_ai/eleves/[id] — Mise à jour des notes et absences d'un élève
import dbConnect from '../../../lib/dbConnect';
import Eleve from '../../../_/models/ai/Eleve';
import User from '../../../_/models/ai/User';
import { NextResponse } from 'next/server';
import { checkRole, Roles } from '../../../../../utils/roles';
import { authWithFallback } from '../../../lib/authWithFallback';
export async function PATCH(request, { params }) {
    try {
        const authResult = await authWithFallback(request, 'PATCH /api/school_ai/eleves/[id]');
        if (!authResult.success) {
            return authResult.response;
        }

        const userId = authResult.userId;
        const isAdmin = await checkRole(Roles.ADMIN, request);
        const isTeacher = await checkRole(Roles.TEACHER, request);

        if (!isAdmin && !isTeacher) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();

        const { id } = params; // eleve _id
        const body = await request.json();

        // Récupérer l'élève
        const eleve = await Eleve.findById(id);
        if (!eleve) {
            return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
        }

        // Vérification d'appartenance : le Teacher ne peut modifier que les élèves de ses classes
        if (isTeacher && !isAdmin) {
            const user = await User.findOne({ clerkId: userId }).populate('roleData.teacherRef');
            if (!user?.roleData?.teacherRef) {
                return NextResponse.json({ error: 'Profil enseignant non trouvé' }, { status: 404 });
            }
            const teacherClasses = user.roleData.teacherRef.current_classes || [];
            const eleveClasseStr = eleve.current_classe?.toString();
            const isOwner = teacherClasses.some(c => c.toString() === eleveClasseStr);
            if (!isOwner) {
                return NextResponse.json({ error: 'Accès refusé : cet élève n\'est pas dans vos classes' }, { status: 403 });
            }
        }

        // --- Traitement de la mise à jour des notes (compositions) ---
        if (body.compositions !== undefined) {
            const comps = body.compositions;
            const compositionErrors = [];

            // Fix #2: Vérification du verrouillage — refuser la modification d'un trimestre verrouillé
            // Sauf si la requête est en train de verrouiller (ajouter _locked)
            const existingComps = eleve.compositions || {};
            Object.entries(comps).forEach(([annee, trimestres]) => {
                if (!Array.isArray(trimestres)) return;
                trimestres.forEach((trimestre, ti) => {
                    if (!trimestre || typeof trimestre !== 'object') return;

                    // Vérifier si ce trimestre est déjà verrouillé dans les données existantes
                    const existingYear = existingComps[annee];
                    if (Array.isArray(existingYear) && existingYear[ti]?._locked === true) {
                        // Le trimestre est verrouillé — seuls les admins peuvent le déverrouiller
                        if (!isAdmin) {
                            compositionErrors.push(
                                `Trimestre ${ti + 1} (${annee}) est verrouillé et ne peut plus être modifié.`
                            );
                            return;
                        }
                    }

                    // Validation des valeurs de notes
                    ['officiel', 'unOfficiel'].forEach(cat => {
                        const catData = trimestre[cat] || {};
                        Object.entries(catData).forEach(([timestamp, subjects]) => {
                            Object.entries(subjects || {}).forEach(([matiere, noteData]) => {
                                if (noteData && typeof noteData === 'object' && noteData.note !== undefined) {
                                    const note = Number(noteData.note);
                                    const sur = Number(noteData.sur || 20);
                                    if (isNaN(note) || note < 0 || note > sur) {
                                        compositionErrors.push(
                                            `Note invalide pour ${matiere} (trimestre ${ti + 1}, ${annee}): ${noteData.note} doit être entre 0 et ${sur}`
                                        );
                                    }
                                }
                            });
                        });
                    });
                });
            });

            if (compositionErrors.length > 0) {
                return NextResponse.json({
                    error: 'Validation des notes échouée',
                    details: compositionErrors
                }, { status: 400 });
            }

            eleve.compositions = { ...eleve.compositions, ...comps };
            eleve.markModified('compositions');
        }

        // --- Traitement de la mise à jour des absences ---
        if (body.absences !== undefined) {
            if (!Array.isArray(body.absences)) {
                return NextResponse.json({ error: 'absences doit être un tableau' }, { status: 400 });
            }
            for (const abs of body.absences) {
                if (abs.count !== undefined && (isNaN(Number(abs.count)) || Number(abs.count) < 0)) {
                    return NextResponse.json({ error: 'Valeur d\'absence invalide (doit être un entier ≥ 0)' }, { status: 400 });
                }
            }
            eleve.absences = body.absences;
            eleve.markModified('absences');
        }

        const updated = await eleve.save();
        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({
            error: 'Erreur lors de la mise à jour de l\'élève',
            details: error.message
        }, { status: 500 });
    }
}
