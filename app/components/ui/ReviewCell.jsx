import React, { useState } from 'react';

/**
 * ReviewCell - Composant granulaire (NFR-PERF-1)
 * Gère son propre état local pour éviter le re-rendu de la liste complète lors de l'édition.
 */
export default function ReviewCell({ index, row, students = [], onChange }) {
    const isWarning = row.confiance < 0.7;

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
        onChange(index, { ...row, notes: nextNotes });
    };

    return (
        <tr className={`review-modal__tr ${isWarning ? '--warning' : ''}`}>
            <td className="review-modal__td-ocr">
                <span className="ocr-text">{row.nom || "N/A"}</span>
                {isWarning && <span className="warning-icon" title="L'IA n'est pas sûre du texte">⚠️</span>}
            </td>
            <td className="review-modal__td-match">
                <select
                    className="review-modal__select-student"
                    value={row.matchedStudentId || ""}
                    onChange={handleStudentMatchChange}
                >
                    <option value="">-- Ignorer cet élève --</option>
                    {students.map(s => (
                        <option key={s._id} value={s._id}>
                            {s.nom} {Array.isArray(s.prenoms) ? s.prenoms[0] : s.prenoms}
                        </option>
                    ))}
                </select>
            </td>
            <td className="review-modal__td-notes">
                <div className="review-modal__notes-preview-grid">
                    {(row.notes || []).map((n, i) => (
                        <div key={i} className="review-modal__note-pill">
                            <span className="ocr-matiere-label">{n.matiere}:</span>
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
                    ))}
                </div>
            </td>
        </tr>
    );
}
