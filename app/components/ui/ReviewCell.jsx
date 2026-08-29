import React, { useState } from 'react';

/**
 * ReviewCell - Composant granulaire (NFR-PERF-1)
 * Gère son propre état local pour éviter le re-rendu de la liste complète lors de l'édition.
 */
export default function ReviewCell({ index, row, students = [], onChange }) {
    const isWarning = row.confiance < 0.7;
    const [isFocused, setIsFocused] = useState(false);

    const handleStudentMatchChange = (e) => {
        onChange(index, { ...row, matchedStudentId: e.target.value });
    };

    const handleNoteValueChange = (matiereIndex, newValue) => {
        const nextNotes = [...(row.notes || [])];
        const val = parseFloat(newValue);
        nextNotes[matiereIndex] = {
            ...nextNotes[matiereIndex],
            note: isNaN(val) ? 0 : Math.min(100, Math.max(0, val))
        };
        // Quand la note est modifiée, on augmente la confiance à 1.0 pour enlever le warning !
        onChange(index, { ...row, notes: nextNotes, confiance: 1.0 });
    };

    const handleFlatNoteChange = (newValue) => {
        const val = parseFloat(newValue);
        // Pour le format plat, on met directement à jour 'note'
        onChange(index, {
            ...row,
            note: isNaN(val) ? 0 : Math.min(100, Math.max(0, val)),
            confiance: 1.0 // Quand la note est modifiée, on augmente la confiance à 1.0 pour enlever le warning !
        });
    };

    const isFlat = !row.notes || row.notes.length === 0;
    const matchedStudent = students.find(s => s._id === row.matchedStudentId);

    return (
        <tr className={`review-modal__tr ${isWarning ? '--is-warning' : ''}`}>
            <td>
                <div className="review-modal__card-ocr">
                    <span className="ocr-text">{row.nom || "N/A"}</span>
                    {isWarning && <span className="warning-icon" title="L'IA n'est pas sûre du texte">⚠️</span>}
                </div>
            </td>
            <td>
                <div className="review-modal__card-match">
                    <select
                        className="review-modal__select-student"
                        value={row.matchedStudentId || ""}
                        onChange={handleStudentMatchChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={{ border: !row.matchedStudentId ? '1px solid #ef4444' : '' }}
                    >
                        {!isFocused ? (
                            <option value={row.matchedStudentId || ""}>
                                {matchedStudent ? `${matchedStudent.nom} ${Array.isArray(matchedStudent.prenoms) ? matchedStudent.prenoms[0] : matchedStudent.prenoms}` : "-- Ignorer cet élève --"}
                            </option>
                        ) : (
                            <>
                                <option value="">-- Ignorer cet élève --</option>
                                {students.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.nom} {Array.isArray(s.prenoms) ? s.prenoms[0] : s.prenoms}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            </td>
            <td>
                <div className="review-modal__notes-preview-grid">
                    {isFlat ? (
                        <div className="review-modal__note-pill">
                            <span className="ocr-matiere-label">Note</span>
                            <input
                                type="number"
                                step="0.25"
                                min="0"
                                max={100}
                                value={row.note ?? ''}
                                onChange={(e) => handleFlatNoteChange(e.target.value)}
                                className="review-modal__note-input-inline"
                            />
                        </div>
                    ) : (
                        (row.notes || []).map((n, i) => (
                            <div key={i} className="review-modal__note-pill">
                                <span className="ocr-matiere-label">{n.matiere}</span>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max={100}
                                    value={n.note}
                                    onChange={(e) => handleNoteValueChange(i, e.target.value)}
                                    className="review-modal__note-input-inline"
                                />
                            </div>
                        ))
                    )}
                </div>
            </td>
        </tr>
    );
}
