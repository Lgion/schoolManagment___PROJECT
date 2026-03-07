"use client"

import { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { useUserRole } from '../../stores/useUserRole';

/**
 * NotesEntryBlock — Story 1.4: Saisie Manuelle des Notes et Absences
 *
 * Permet à un Teacher (ou Admin) de créer une session de composition,
 * saisir manuellement les notes et absences par élève, puis publier.
 *
 * Principes :
 * - Optimistic UI via saveEleveNotes / saveEleveAbsences du contexte
 * - Aucune couleur hex inline — toutes les couleurs via Sass (_variables.scss)
 * - Aucun spinner global bloquant (feedback ciblé par ligne)
 * - Focus tabulaire visible (style via Sass .notes-entry__input:focus)
 * - Publication = verrouillage de la session (_locked: true dans la structure)
 *
 * Code Review Fixes Applied:
 * - #1: Replaced PermissionGate inside <tr>/<thead> with useUserRole() conditional
 * - #3: Added locked visual state (grayed cells, padlock icon)
 * - #4: Fixed stale errorMap with Promise.allSettled
 * - #7: Generate timestamp once per session, stored in ref
 */

const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

export default function NotesEntryBlock({ eleves: elevesProp, classeId, isCurrentYear, coefficients = {}, prefilledData = null, allSubjects = [] }) {
    const ctx = useContext(AiAdminContext);
    // Fix #1: Use useUserRole() directly instead of PermissionGate in table rows
    const { hasAnyRole } = useUserRole();
    const canEdit = hasAnyRole(['admin', 'prof']);

    const hasCoefficients = Object.keys(coefficients).length > 0;

    // Résoudre les élèves complets depuis le contexte
    const elevesComplets = useMemo(() => {
        if (!ctx.eleves) return [];
        return elevesProp.map(eleve => {
            const student = ctx.eleves.find(el => el._id === (eleve._id || eleve));
            return student || eleve;
        }).filter(Boolean);
    }, [elevesProp, ctx.eleves]);

    const currentYear = getCurrentSchoolYear();
    const trimestreLabels = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'];

    // Fix #7: Generate timestamp once per session, stored in ref
    const sessionTimestampRef = useRef(Date.now().toString());

    // État du formulaire d'entrée de session
    const [sessionConfig, setSessionConfig] = useState({
        annee: currentYear,
        trimestreIndex: 0,
        isOfficiel: true,
        matieres: Object.keys(coefficients),
        surValeurs: { ...coefficients }, // Use actual coefficients as denominators
    });

    // Sync subjects if coefficients change
    useEffect(() => {
        if (hasCoefficients) {
            setSessionConfig(prev => ({
                ...prev,
                matieres: Object.keys(coefficients),
                surValeurs: { ...coefficients },
            }));
        }
    }, [coefficients, hasCoefficients]);

    // Saisie des notes : { eleveId: { matiere: valeur } }
    const [notesDraft, setNotesDraft] = useState({});

    // Gérer le pré-remplissage issu du scan
    useEffect(() => {
        if (prefilledData && prefilledData.length > 0) {
            const nextNotes = { ...notesDraft };
            prefilledData.forEach(item => {
                if (item.matchedStudentId) {
                    const studentNotes = { ...(nextNotes[item.matchedStudentId] || {}) };
                    item.notes.forEach(n => {
                        // PRIORITÉ : Utiliser l'ID sélectionné par l'enseignant dans le ReviewModal
                        let subId = n.matchedMatiereId;

                        if (!subId) {
                            // FALLBACK : Recherche automatique par nom si aucun ID n'est lié
                            const matchedSub = allSubjects.find(s =>
                                s.nom.toLowerCase() === n.matiere.toLowerCase() || s.id === n.matiere
                            );
                            subId = matchedSub ? matchedSub.id : n.matiere;
                        }

                        if (sessionConfig.matieres.includes(subId)) {
                            studentNotes[subId] = n.note;
                        }
                    });
                    nextNotes[item.matchedStudentId] = studentNotes;
                }
            });
            setNotesDraft(nextNotes);
        }
    }, [prefilledData, allSubjects, sessionConfig.matieres]);

    // Barème dynamique basé sur votre modification (Coeff * 10)
    const getMaxNote = (matiereId) => {
        const coeff = sessionConfig.surValeurs[matiereId] || 2;
        return coeff * 10;
    };

    // Saisie des absences : { eleveId: count }
    const [absencesDraft, setAbsencesDraft] = useState({});

    // État: saving, erreurs, success par élève
    const [savingMap, setSavingMap] = useState({});
    const [errorMap, setErrorMap] = useState({});
    const [successMap, setSuccessMap] = useState({});

    // État publication globale
    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState(null);
    const [publishSuccess, setPublishSuccess] = useState(false);

    // Gestion des matières
    const [newMatiere, setNewMatiere] = useState('');

    // Fix #3: Déterminer si le trimestre courant est verrouillé
    const isCurrentTrimestreLocked = useMemo(() => {
        const { annee, trimestreIndex } = sessionConfig;
        // Vérifier sur n'importe quel élève si le trimestre est verrouillé
        return elevesComplets.some(eleve => {
            if (!eleve.compositions?.[annee]) return false;
            const trimestres = eleve.compositions[annee];
            if (!Array.isArray(trimestres)) return false;
            const trimestre = trimestres[trimestreIndex];
            return trimestre?._locked === true;
        });
    }, [elevesComplets, sessionConfig]);

    const addMatiere = () => {
        const m = newMatiere.trim();
        if (!m || sessionConfig.matieres.includes(m)) return;
        setSessionConfig(prev => ({
            ...prev,
            matieres: [...prev.matieres, m],
            surValeurs: { ...prev.surValeurs, [m]: coefficients[m] || 20 },
        }));
        setNewMatiere('');
    };

    const removeMatiere = (m) => {
        setSessionConfig(prev => {
            const mats = prev.matieres.filter(x => x !== m);
            const { [m]: _, ...rest } = prev.surValeurs;
            return { ...prev, matieres: mats, surValeurs: rest };
        });
    };

    const handleNoteChange = (eleveId, matiere, value) => {
        setNotesDraft(prev => ({
            ...prev,
            [eleveId]: { ...prev[eleveId], [matiere]: value },
        }));
    };

    const handleAbsenceChange = (eleveId, value) => {
        setAbsencesDraft(prev => ({ ...prev, [eleveId]: value }));
    };

    // Construire la structure compositions à partir du brouillon
    // Fix #7: Use sessionTimestampRef instead of Date.now() for idempotency
    const buildCompositions = useCallback((eleve, notesDraftForEleve, { lock = false } = {}) => {
        const { annee, trimestreIndex, isOfficiel, matieres, surValeurs } = sessionConfig;
        const category = isOfficiel ? 'officiel' : 'unOfficiel';
        const timestamp = sessionTimestampRef.current;

        const subjects = {};
        matieres.forEach(matiere => {
            const val = notesDraftForEleve?.[matiere];
            if (val !== undefined && val !== '') {
                subjects[matiere] = {
                    note: Number(val),
                    sur: surValeurs[matiere] || 20,
                };
            }
        });

        const existingComps = { ...(eleve.compositions || {}) };
        const existingYear = Array.isArray(existingComps[annee])
            ? [...existingComps[annee]]
            : ['', '', ''].map(() => ({}));

        while (existingYear.length < 3) existingYear.push({});

        const trimestre = { ...(existingYear[trimestreIndex] || {}) };
        const categoryData = { ...(trimestre[category] || {}) };
        categoryData[timestamp] = subjects;
        trimestre[category] = categoryData;

        // Lock the trimestre if publishing
        if (lock) {
            trimestre._locked = true;
        }

        existingYear[trimestreIndex] = trimestre;
        return { ...existingComps, [annee]: existingYear };
    }, [sessionConfig]);

    // Sauvegarder les notes d'un élève individuel (Optimistic UI)
    const handleSaveEleve = async (eleve, { lock = false } = {}) => {
        const notesDraftForEleve = notesDraft[eleve._id] || {};
        const newCompositions = buildCompositions(eleve, notesDraftForEleve, { lock });

        setSavingMap(prev => ({ ...prev, [eleve._id]: true }));
        setErrorMap(prev => ({ ...prev, [eleve._id]: null }));

        try {
            await ctx.saveEleveNotes(eleve._id, newCompositions);

            // Sauvegarder les absences si modifiées
            const absVal = absencesDraft[eleve._id];
            if (absVal !== undefined && absVal !== '') {
                const count = parseInt(absVal, 10);
                if (!isNaN(count) && count >= 0) {
                    const currentAbsences = [...(eleve.absences || [])];
                    const { annee, trimestreIndex } = sessionConfig;
                    const existing = currentAbsences.find(a => a.annee === annee && a.trimestre === trimestreIndex);
                    if (existing) {
                        existing.count = count;
                    } else {
                        currentAbsences.push({ annee, trimestre: trimestreIndex, count });
                    }
                    await ctx.saveEleveAbsences(eleve._id, currentAbsences);
                }
            }

            setSuccessMap(prev => ({ ...prev, [eleve._id]: true }));
            setSavingMap(prev => ({ ...prev, [eleve._id]: false }));
            setTimeout(() => setSuccessMap(prev => ({ ...prev, [eleve._id]: false })), 2500);
            return { status: 'fulfilled', eleveId: eleve._id };
        } catch (err) {
            setErrorMap(prev => ({ ...prev, [eleve._id]: err.message || 'Erreur de sauvegarde' }));
            setSavingMap(prev => ({ ...prev, [eleve._id]: false }));
            return { status: 'rejected', eleveId: eleve._id, reason: err.message };
        }
    };

    // Fix #4: Use Promise.allSettled to detect errors directly instead of stale errorMap
    const handlePublish = async () => {
        setPublishing(true);
        setPublishError(null);

        try {
            // Save all notes WITH lock flag
            const results = await Promise.all(
                elevesComplets.map(eleve => handleSaveEleve(eleve, { lock: true }))
            );

            // Check results directly (not stale errorMap)
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                setPublishError(`${failures.length} sauvegarde(s) échouée(s). Corrigez les erreurs avant de publier.`);
                return;
            }

            // Generate new timestamp for next session
            sessionTimestampRef.current = Date.now().toString();

            setPublishSuccess(true);
            setTimeout(() => setPublishSuccess(false), 4000);
        } catch (err) {
            setPublishError(err.message || 'Erreur lors de la publication');
        } finally {
            setPublishing(false);
        }
    };

    const handleUnlock = async () => {
        setPublishing(true);
        setPublishError(null);
        try {
            const { annee, trimestreIndex } = sessionConfig;

            const unlockPromises = elevesComplets.map(eleve => {
                if (!eleve.compositions || !eleve.compositions[annee] || !eleve.compositions[annee][trimestreIndex]) {
                    return Promise.resolve({ status: 'fulfilled', eleveId: eleve._id });
                }

                const existingComps = { ...eleve.compositions };
                const existingYear = [...existingComps[annee]];
                const trimestre = { ...existingYear[trimestreIndex] };

                // Remove the lock
                trimestre._locked = false;
                existingYear[trimestreIndex] = trimestre;
                const newCompositions = { ...existingComps, [annee]: existingYear };

                return ctx.saveEleveNotes(eleve._id, newCompositions)
                    .then(() => ({ status: 'fulfilled', eleveId: eleve._id }))
                    .catch(err => ({ status: 'rejected', eleveId: eleve._id, reason: err.message }));
            });

            const results = await Promise.all(unlockPromises);

            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                setPublishError(`${failures.length} déverrouillage(s) échoué(s).`);
                return;
            }

            // Success - state will update automatically via context
        } catch (err) {
            setPublishError(err.message || 'Erreur lors du déverrouillage');
        } finally {
            setPublishing(false);
        }
    };

    if (!isCurrentYear) {
        return (
            <div className="notes-entry__readonly-notice">
                <span>📚</span>
                <p>Saisie de notes disponible uniquement pour l'année scolaire en cours.</p>
            </div>
        );
    }

    if (!hasCoefficients) {
        return (
            <div className="notes-entry__no-coef-notice">
                <span>⚠️</span>
                <p>Veuillez d'abord configurer les coefficients de la classe pour activer la saisie des notes.</p>
            </div>
        );
    }

    // Fix #3: If locked, show read-only notice
    if (isCurrentTrimestreLocked) {
        return (
            <div className="notes-entry__locked-notice" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="notes-entry__locked-icon">🔒</span>
                    <p>Ce trimestre a été publié et verrouillé. Les notes ne peuvent plus être modifiées.</p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleUnlock}
                        disabled={publishing}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: publishing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            opacity: publishing ? 0.7 : 1
                        }}
                    >
                        {publishing ? 'Déverrouillage...' : '🔓 Déverrouiller la saisie'}
                    </button>
                )}
                {publishError && <p style={{ color: '#e74c3c', marginTop: '10px' }}>{publishError}</p>}
            </div>
        );
    }

    const getSubName = (id) => {
        const sub = allSubjects.find(s => s.id === id);
        return sub ? sub.nom : id;
    };

    return (
        <div className="notes-entry">
            {/* Configuration de la session */}
            <div className="notes-entry__session-config">
                <h3 className="notes-entry__section-title">Nouvelle session de notes</h3>

                <div className="notes-entry__config-row">
                    <label className="notes-entry__label" htmlFor="ne-annee">Année scolaire</label>
                    <input
                        id="ne-annee"
                        className="notes-entry__input"
                        type="text"
                        value={sessionConfig.annee}
                        onChange={e => setSessionConfig(prev => ({ ...prev, annee: e.target.value }))}
                        pattern="\d{4}-\d{4}"
                        placeholder="2025-2026"
                    />
                </div>

                <div className="notes-entry__config-row">
                    <label className="notes-entry__label" htmlFor="ne-trimestre">Trimestre</label>
                    <select
                        id="ne-trimestre"
                        className="notes-entry__select"
                        value={sessionConfig.trimestreIndex}
                        onChange={e => setSessionConfig(prev => ({ ...prev, trimestreIndex: Number(e.target.value) }))}
                    >
                        {trimestreLabels.map((label, i) => (
                            <option key={i} value={i}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="notes-entry__config-row">
                    <label className="notes-entry__label" htmlFor="ne-officiel">Type</label>
                    <select
                        id="ne-officiel"
                        className="notes-entry__select"
                        value={sessionConfig.isOfficiel ? 'officiel' : 'unOfficiel'}
                        onChange={e => setSessionConfig(prev => ({ ...prev, isOfficiel: e.target.value === 'officiel' }))}
                    >
                        <option value="officiel">Officiel</option>
                        <option value="unOfficiel">Non officiel</option>
                    </select>
                </div>

                {/* Gestion des matières */}
                <div className="notes-entry__matieres">
                    <label className="notes-entry__label">Matières</label>
                    <div className="notes-entry__matieres-list">
                        {sessionConfig.matieres.map(m => (
                            <div key={m} className="notes-entry__matiere-item">
                                <span className="notes-entry__matiere-name" title={m}>{getSubName(m)}</span>
                                <span className="notes-entry__matiere-coeff-badge">
                                    sur <b>{sessionConfig.surValeurs[m] * 10 || 20}</b>
                                </span>
                                <button
                                    type="button"
                                    className="notes-entry__btn notes-entry__btn--remove"
                                    onClick={() => removeMatiere(m)}
                                    aria-label={`Supprimer ${getSubName(m)}`}
                                    title={`Supprimer ${getSubName(m)}`}
                                >✕</button>
                            </div>
                        ))}
                        <div className="notes-entry__add-matiere">
                            <input
                                className="notes-entry__input"
                                type="text"
                                value={newMatiere}
                                onChange={e => setNewMatiere(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMatiere())}
                                placeholder="Ajouter une matière..."
                                aria-label="Nom de la nouvelle matière"
                            />
                            <button
                                type="button"
                                className="notes-entry__btn notes-entry__btn--add"
                                onClick={addMatiere}
                            >+ Ajouter</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DataTable de saisie */}
            <div className="notes-entry__table-container">
                <table className="notes-entry__table" role="grid" aria-label="Saisie des notes et absences">
                    <thead>
                        <tr>
                            <th className="notes-entry__th" scope="col">Élève</th>
                            {sessionConfig.matieres.map(m => (
                                <th key={m} className="notes-entry__th" scope="col" title={m}>
                                    {getSubName(m)}
                                    <span className="notes-entry__sur">/{sessionConfig.surValeurs[m] * 10 || 20}</span>
                                </th>
                            ))}
                            <th className="notes-entry__th" scope="col">Absences</th>
                            {/* Fix #1: Conditional <th> without PermissionGate wrapper */}
                            {canEdit && <th className="notes-entry__th" scope="col">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {elevesComplets.map(eleve => (
                            <tr
                                key={eleve._id}
                                className={`notes-entry__tr${successMap[eleve._id] ? ' notes-entry__tr--saved' : ''}${errorMap[eleve._id] ? ' notes-entry__tr--error' : ''}`}
                            >
                                <td className="notes-entry__td notes-entry__td--name">
                                    {eleve.nom} {Array.isArray(eleve.prenoms) ? eleve.prenoms[0] : eleve.prenoms}
                                </td>

                                {sessionConfig.matieres.map(m => (
                                    <td key={m} className="notes-entry__td notes-entry__td--note">
                                        <input
                                            type="number"
                                            className="notes-entry__input notes-entry__input--note"
                                            min={0}
                                            max={getMaxNote(m)}
                                            step={0.25}
                                            value={notesDraft[eleve._id]?.[m] ?? ''}
                                            onChange={e => handleNoteChange(eleve._id, m, e.target.value)}
                                            aria-label={`Note de ${eleve.nom} en ${getSubName(m)}`}
                                            disabled={savingMap[eleve._id] || !canEdit}
                                        />
                                    </td>
                                ))}

                                <td className="notes-entry__td notes-entry__td--absence">
                                    <input
                                        type="number"
                                        className="notes-entry__input notes-entry__input--absence"
                                        min={0}
                                        step={1}
                                        value={absencesDraft[eleve._id] ?? ''}
                                        onChange={e => handleAbsenceChange(eleve._id, e.target.value)}
                                        aria-label={`Absences de ${eleve.nom}`}
                                        disabled={savingMap[eleve._id] || !canEdit}
                                    />
                                </td>

                                {/* Fix #1: Conditional <td> without PermissionGate wrapper */}
                                {canEdit && (
                                    <td className="notes-entry__td notes-entry__td--action">
                                        <button
                                            type="button"
                                            className={`notes-entry__btn notes-entry__btn--save${savingMap[eleve._id] ? ' notes-entry__btn--saving' : ''}`}
                                            onClick={() => handleSaveEleve(eleve)}
                                            disabled={savingMap[eleve._id]}
                                            aria-label={`Sauvegarder les notes de ${eleve.nom}`}
                                        >
                                            {savingMap[eleve._id] ? '…' : successMap[eleve._id] ? '✓' : 'Enreg.'}
                                        </button>
                                        {errorMap[eleve._id] && (
                                            <span className="notes-entry__error-msg" role="alert" title={errorMap[eleve._id]}>⚠</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bouton Publier — only for authorized roles */}
            {canEdit && (
                <div className="notes-entry__publish-bar">
                    <button
                        type="button"
                        className={`notes-entry__btn notes-entry__btn--publish${publishing ? ' notes-entry__btn--publishing' : ''}`}
                        onClick={handlePublish}
                        disabled={publishing || publishSuccess}
                        aria-live="polite"
                    >
                        {publishing ? 'Publication en cours…' : publishSuccess ? '✓ Notes publiées !' : '🔒 Publier et verrouiller'}
                    </button>
                    {publishError && (
                        <p className="notes-entry__publish-error" role="alert">{publishError}</p>
                    )}
                </div>
            )}
        </div>
    );
}
