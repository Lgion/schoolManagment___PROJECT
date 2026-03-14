"use client"

/**
 * HistoriqueBlock — Story 1.5: Consultation de l'Historique Inaltérable
 *
 * Composant de visualisation en LECTURE SEULE de l'historique complet d'un élève.
 * Admin-only — le parent doit wrapper avec <PermissionGate roles={['admin']}>
 *
 * Props:
 * - eleveId: string — ID MongoDB de l'élève
 *
 * Architecture:
 * - Task 2.1: Nouveau composant isolé
 * - Task 2.2: Sélecteur d'année + onglets trimestre
 * - Task 2.3: Affichage: classe, notes (compositions), absences, scolarité
 * - Task 2.4: 100% read-only — aucun <input> dans ce composant
 * - Task 2.5: Skeleton ciblé pendant chargement (no global spinner)
 *
 * Conformité:
 * - Aucun style inline, 100% CSS custom properties via historiqueBlock.scss
 * - PermissionGate JAMAIS dans un <tr>/<td> — useUserRole() conditionnel si besoin
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const TRIMESTRE_LABELS = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'];

// Helper: extraire les années disponibles depuis les données historiques
function getAvailableYears(data) {
    if (!data) return [];
    const yearsSet = new Set();

    // Depuis compositions
    if (data.compositions && typeof data.compositions === 'object') {
        Object.keys(data.compositions).forEach(y => yearsSet.add(y));
    }
    // Depuis notes
    if (data.notes && typeof data.notes === 'object') {
        Object.keys(data.notes).forEach(y => yearsSet.add(y));
    }
    // Depuis school_history
    if (data.school_history && typeof data.school_history === 'object') {
        Object.keys(data.school_history).forEach(y => yearsSet.add(y));
    }
    // Depuis bolobi_class_history
    if (data.bolobi_class_history && typeof data.bolobi_class_history === 'object') {
        Object.keys(data.bolobi_class_history).forEach(y => yearsSet.add(y));
    }
    // Depuis scolarity_fees
    if (data.scolarity_fees && typeof data.scolarity_fees === 'object') {
        Object.keys(data.scolarity_fees).forEach(y => yearsSet.add(y));
    }

    // Trier par année décroissante
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
}

// Helper: extraire les absences pour une année donnée (format défensif)
function getAbsencesForYear(absences, annee) {
    if (!absences) return [];
    // Nouveau format (Story 1.4): Array de { annee, trimestre, count }
    if (Array.isArray(absences)) {
        return absences.filter(a => a && a.annee === annee);
    }
    // Ancien format: Object plat par année
    if (typeof absences === 'object' && absences[annee]) {
        console.warn('[HistoriqueBlock] absences au format Object (ancien) — adaptation appliquée');
        return [{ annee, trimestre: 'global', count: absences[annee] }];
    }
    return [];
}

// Helper: extraire les notes de composition pour une année et un trimestre
// FIX #1: Restructuré pour tester Array (legacy) AVANT Object (nouveau format)
// afin que la branche legacy soit atteignable
function getCompositionsForTrimestre(compositions, annee, trimestreIndex) {
    if (!compositions || typeof compositions !== 'object') return [];
    const year = compositions[annee];
    if (!Array.isArray(year)) return [];
    const trimestre = year[trimestreIndex];
    if (!trimestre) return [];

    const sessions = [];

    // Format legacy: Array d'objets {date, matiere: note}
    // — vérifié EN PREMIER car Array.isArray serait bloqué par le check typeof object
    if (Array.isArray(trimestre)) {
        trimestre.forEach(noteObj => {
            if (!noteObj || !noteObj.date) return;
            const notes = Object.entries(noteObj)
                .filter(([k]) => k !== 'date' && k !== 'officiel')
                .map(([matiere, note]) => ({ matiere, note, sur: 20 }));
            if (notes.length > 0) {
                sessions.push({
                    dateStr: noteObj.date,
                    category: noteObj.officiel ? 'officiel' : 'non officiel',
                    isOfficiel: !!noteObj.officiel,
                    notes
                });
            }
        });
        return sessions;
    }

    // Nouvelle structure Story 1.4: { officiel: { timestamp: { matiere: { note, sur } } }, _locked }
    if (typeof trimestre !== 'object') return [];

    ['officiel', 'unOfficiel'].forEach(category => {
        const catData = trimestre[category];
        if (!catData || typeof catData !== 'object') return;
        Object.entries(catData).forEach(([timestamp, subjects]) => {
            if (!subjects || typeof subjects !== 'object') return;
            const date = new Date(parseInt(timestamp));
            const dateStr = isNaN(date.getTime()) ? timestamp : date.toLocaleDateString('fr-FR');
            const notes = [];
            Object.entries(subjects).forEach(([matiere, noteData]) => {
                if (noteData && typeof noteData === 'object' && noteData.note !== undefined) {
                    notes.push({ matiere, note: noteData.note, sur: noteData.sur || 20 });
                }
            });
            if (notes.length > 0) {
                sessions.push({ dateStr, category, isOfficiel: category === 'officiel', notes });
            }
        });
    });

    return sessions;
}

// Sous-composant Skeleton
function HistoriqueSkeleton() {
    return (
        <div className="historique-block__skeleton" aria-busy="true" aria-label="Chargement de l'historique...">
            <div className="historique-block__skeleton-bar historique-block__skeleton-bar--title" />
            <div className="historique-block__skeleton-bar historique-block__skeleton-bar--tabs" />
            <div className="historique-block__skeleton-bar historique-block__skeleton-bar--content" />
            <div className="historique-block__skeleton-bar historique-block__skeleton-bar--content" />
            <div className="historique-block__skeleton-bar historique-block__skeleton-bar--content" />
        </div>
    );
}

export default function HistoriqueBlock({ eleveId }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedTrimestre, setSelectedTrimestre] = useState(0);

    // Task 2.1: Charger les données historiques depuis l'API
    // FIX #5: eleveId null/undefined → setLoading(false) pour éviter skeleton infini
    const fetchHistory = useCallback(async () => {
        if (!eleveId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/school_ai/eleves/${eleveId}/history`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Erreur ${res.status}`);
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eleveId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Task 2.2: Calculer les années disponibles
    const availableYears = useMemo(() => getAvailableYears(data), [data]);

    // FIX #6: Réinitialise selectedYear quand eleveId change (nouvel élève)
    // sans réinitialisation, l'année de l'élève précédent resterait sélectionnée
    useEffect(() => {
        setSelectedYear(null);
        setSelectedTrimestre(0);
    }, [eleveId]);

    // Sélectionne la première année dès que les données sont disponibles
    useEffect(() => {
        if (availableYears.length > 0 && !selectedYear) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    // Task 2.5: Skeleton pendant chargement
    if (loading) return <HistoriqueSkeleton />;

    if (error) {
        return (
            <div className="historique-block__error" role="alert">
                <span className="historique-block__error-icon">⚠️</span>
                <span>{error}</span>
                <button
                    type="button"
                    className="historique-block__btn historique-block__btn--retry"
                    onClick={fetchHistory}
                >
                    Réessayer
                </button>
            </div>
        );
    }

    // Task 2.4: Aucune donnée historique disponible
    if (availableYears.length === 0) {
        return (
            <div className="historique-block__empty">
                <span className="historique-block__empty-icon">📚</span>
                <p>Aucun historique disponible pour cet élève.</p>
            </div>
        );
    }

    // Données pour l'année sélectionnée
    const year = selectedYear || availableYears[0];
    const classeInfo = data?.bolobi_class_history?.[year];
    const schoolName = data?.school_history?.[year];
    const scolarityFee = data?.scolarity_fees?.[year];
    const absencesForYear = getAbsencesForYear(data?.absences, year);
    const trimSessions = getCompositionsForTrimestre(data?.compositions, year, selectedTrimestre);
    // FIX #8 (LOW): comparaison directe Number === Number, pas besoin de String()
    const absForTrimestre = absencesForYear.filter(a => a.trimestre === selectedTrimestre);

    // FIX #2: Logique scolarité corrigée
    // Schéma réel scolarity_fees_$_checkbox: { annee: Boolean } OU { annee: { argent, riz } } OU dynamic format
    // — Boolean true = payé
    // — Object avec paid: true = payé (futur format)
    // — Object avec argent > 0 ou amount > 0 = paiement partiel/complet
    const scolarityPaid =
        scolarityFee === true ||
        (typeof scolarityFee === 'object' && scolarityFee !== null && (
            scolarityFee.paid === true ||
            Number(scolarityFee.argent) > 0 ||
            Number(scolarityFee.amount) > 0
        ));

    return (
        <div className="historique-block">
            <div className="historique-block__header">
                <h3 className="historique-block__title">
                    <span className="historique-block__title-icon">🗂️</span>
                    Historique Scolaire
                    <span className="historique-block__badge historique-block__badge--readonly">Lecture seule</span>
                </h3>
            </div>

            {/* Task 2.2: Sélecteur d'année */}
            <div className="historique-block__year-selector" role="tablist" aria-label="Année scolaire">
                {availableYears.map(y => (
                    <button
                        key={y}
                        role="tab"
                        type="button"
                        className={`historique-block__year-tab${y === year ? ' historique-block__year-tab--active' : ''}`}
                        aria-selected={y === year}
                        onClick={() => { setSelectedYear(y); setSelectedTrimestre(0); }}
                    >
                        {y}
                    </button>
                ))}
            </div>

            {/* Task 2.3: Infos de l'année sélectionnée */}
            <div className="historique-block__year-overview">
                <div className="historique-block__info-row">
                    <span className="historique-block__info-label">Classe :</span>
                    <span className="historique-block__info-value">
                        {classeInfo?.nom || classeInfo?._id || '—'}
                    </span>
                </div>
                {schoolName && (
                    <div className="historique-block__info-row">
                        <span className="historique-block__info-label">École :</span>
                        <span className="historique-block__info-value">{schoolName}</span>
                    </div>
                )}
                <div className="historique-block__info-row">
                    <span className="historique-block__info-label">Scolarité :</span>
                    <span
                        className={`historique-block__scolarite-badge${scolarityPaid ? ' historique-block__scolarite-badge--paid' : ' historique-block__scolarite-badge--unpaid'}`}
                    >
                        {scolarityPaid ? '✅ Réglée' : '⚠️ Non réglée'}
                    </span>
                </div>
            </div>

            {/* Sélecteur de trimestre */}
            <div className="historique-block__trimestre-tabs" role="tablist" aria-label="Trimestre">
                {TRIMESTRE_LABELS.map((label, i) => (
                    <button
                        key={i}
                        role="tab"
                        type="button"
                        className={`historique-block__trimestre-tab${i === selectedTrimestre ? ' historique-block__trimestre-tab--active' : ''}`}
                        aria-selected={i === selectedTrimestre}
                        onClick={() => setSelectedTrimestre(i)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Task 2.3: Absences du trimestre */}
            <div className="historique-block__absences">
                <span className="historique-block__info-label">Absences :</span>
                {absForTrimestre.length === 0 ? (
                    <span className="historique-block__info-value historique-block__info-value--empty">—</span>
                ) : (
                    absForTrimestre.map((a, i) => (
                        <span key={i} className="historique-block__absence-count">
                            {a.count} jour{a.count > 1 ? 's' : ''}
                        </span>
                    ))
                )}
            </div>

            {/* Task 2.3: Notes de composition par session */}
            {trimSessions.length === 0 ? (
                <div className="historique-block__no-notes">
                    <span>Aucune note enregistrée pour ce trimestre.</span>
                </div>
            ) : (
                <div className="historique-block__sessions">
                    {trimSessions.map((session, si) => (
                        <div key={si} className="historique-block__session">
                            <div className="historique-block__session-header">
                                <span className="historique-block__session-date">{session.dateStr}</span>
                                <span className={`historique-block__session-type${session.isOfficiel ? ' historique-block__session-type--officiel' : ' historique-block__session-type--unofficiel'}`}>
                                    {session.isOfficiel ? 'Officiel' : 'Non officiel'}
                                </span>
                            </div>
                            <table className="historique-block__table" aria-label={`Notes du ${session.dateStr}`}>
                                <thead>
                                    <tr>
                                        <th className="historique-block__th">Matière</th>
                                        <th className="historique-block__th">Note</th>
                                        <th className="historique-block__th">Barème</th>
                                        <th className="historique-block__th">/10</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.notes.map(({ matiere, note, sur }) => (
                                        <tr key={matiere} className="historique-block__tr">
                                            <td className="historique-block__td historique-block__td--matiere">{matiere}</td>
                                            <td className="historique-block__td historique-block__td--note">{note}</td>
                                            <td className="historique-block__td historique-block__td--sur">/{sur}</td>
                                            <td className="historique-block__td historique-block__td--dix">
                                                {((note / sur) * 10).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
