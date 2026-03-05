import React, { useState } from 'react';

/**
 * ReviewCell - Composant granulaire (NFR-PERF-1)
 * Gère son propre état local pour éviter le re-rendu de la liste complète lors de l'édition.
 */
export default function ReviewCell({ index, row, onChange }) {
    // État initial de la valeur
    const [value, setValue] = useState(row.note !== undefined && row.note !== null ? row.note : '');
    const [isDirty, setIsDirty] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Un style d'avertissement s'affiche si l'IA doute ET que l'user n'a pas encore modifié la case
    const initialWarning = row.confiance < 0.8;
    const isWarning = initialWarning && !isDirty;

    const handleChange = (e) => {
        let rawValue = e.target.value;
        // Strict boundaries check
        if (!isNaN(numericValue)) {
            if (numericValue < 0) rawValue = "0";
            if (numericValue > 20) rawValue = "20";
        }

        setValue(rawValue);

        // Optimistic State Update
        setIsDirty(true);

        const currentNum = parseFloat(rawValue);
        const nextNote = isNaN(currentNum) ? null : currentNum;

        // On propage silencieusement au parent via la ref pour la validation finale
        onChange(index, {
            ...row,
            note: nextNote,
            isEdited: true
        });
    };

    return (
        <tr
            className={`review-modal__cell-warning ${isWarning ? '--is-warning' : ''} ${isFocused ? '--is-focused' : ''}`}
            title={isWarning ? "Vérification recommandée" : ""}
        >
            <td className="review-modal__cell-name">{row.nom || '-'}</td>
            <td>
                <input
                    type="number"
                    className="review-modal__cell-score-input"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="?"
                    step="0.25"
                    min="0"
                    max="20"
                />
            </td>
        </tr>
    );
}
