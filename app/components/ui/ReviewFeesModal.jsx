import React, { useState, useEffect, useRef } from 'react';
import '../../assets/scss/components/MODALS/reviewModal.scss';

export default function ReviewFeesModal({ file, extractedData, students = [], onClose, onValidate }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef(null);
    const containerRef = useRef(null);
    const [isReduced, setIsReduced] = useState(false);

    const [rows, setRows] = useState([]);

    // Algorithme de matching initial
    useEffect(() => {
        if (!extractedData) return;

        // Préparer les lignes d'élèves (matching élèves seulement ici)
        const matched = extractedData.map(item => {
            const rawName = (item.nom || "").toLowerCase().trim();
            const bestMatch = students.find(s => {
                const sNom = (s.nom || "").toLowerCase();
                const sPrenom = (Array.isArray(s.prenoms) ? s.prenoms[0] : s.prenoms || "").toLowerCase();
                return rawName.includes(sNom) || rawName.includes(sPrenom) || sNom.includes(rawName);
            });

            return {
                ...item,
                matchedStudentId: bestMatch ? bestMatch._id : null
            };
        });
        setRows(matched);
    }, [extractedData, students]);

    // Réinitialiser le mode réduit UNIQUEMENT si de nouvelles données brut d'extraction arrivent
    useEffect(() => {
        setIsReduced(false);
    }, [extractedData]);

    // Initialisation et focus trap basique + a11y (Escape)
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Manage ObjectURL lifecycle for memory safety (Zero-Waste principle)
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [file]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleRowChange = (index, field, value) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const triggerValidation = () => {
        // 1. Vérifier doublons Élèves
        const selectedStudentIds = rows.map(r => r.matchedStudentId).filter(Boolean);
        const duplicateStudentIds = selectedStudentIds.filter((id, index) => selectedStudentIds.indexOf(id) !== index);

        if (duplicateStudentIds.length > 0) {
            const duplicateNames = [...new Set(duplicateStudentIds.map(id => {
                const stu = students.find(s => s._id === id);
                return stu ? `${stu.nom} ${Array.isArray(stu.prenoms) ? stu.prenoms[0] : stu.prenoms}` : id;
            }))];
            alert(`⚠️ Erreur : Les élèves suivants ont été liés à plusieurs lignes : ${duplicateNames.join(', ')}. Chaque élève ne peut apparaître qu'une seule fois. Si vous avez plusieurs paiements pour le même élève, veuillez les additionner sur une seule ligne.`);
            return;
        }

        // 2. Vérifier que tout est lié
        const allStudentsMapped = rows.every(r => !!r.matchedStudentId);

        if (!allStudentsMapped) {
            alert("⚠️ Attention : Certains élèves du document n'ont pas encore été associés à un compte étudiant.");
            return;
        }

        // Vérifier les montants négatifs
        const hasNegativeAmounts = rows.some(r => (r.argent !== undefined && r.argent < 0) || (r.riz !== undefined && r.riz < 0));
        if (hasNegativeAmounts) {
            alert("⚠️ Erreur : Les montants d'argent et les quantités de riz ne peuvent pas être négatifs.");
            return;
        }

        onValidate(rows);
        setIsReduced(true); // Au lieu de fermer, on réduit
    };

    if (!file || !extractedData) {
        return null;
    }

    if (isReduced) {
        return (
            <div className="review-modal --reduced-banner" onClick={() => setIsReduced(false)}>
                <div className="review-modal__reduced-content">
                    <span>✨ L'analyse IA des paiements a été complétée.</span>
                    <button className="review-modal__btn-reopen">Modifier l'analyse</button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="review-modal --inline"
            role="region"
            aria-labelledby="review-modal-title"
            ref={containerRef}
        >
            <div className="review-modal__container" style={{ maxWidth: '1000px' }}>
                <header className="review-modal__header">
                    <h2 id="review-modal-title">
                        <span>✨</span> Vérification des Paiements
                    </h2>
                    <div className="review-modal__header-actions">
                        <button
                            className="review-modal__btn-cancel"
                            onClick={onClose}
                        >
                            Abandonner
                        </button>
                        <button
                            className="review-modal__btn-validate"
                            onClick={triggerValidation}
                            title="Valider la correspondance et appliquer les paiements"
                        >
                            Appliquer les Paiements
                        </button>
                    </div>
                </header>

                <div className="review-modal__body" style={{ flexDirection: 'column' }}>
                    <div className="review-modal__above-panel" style={{ height: '30vh', minHeight: '200px' }}>
                        <div className="review-modal__image-container">
                            {imageUrl && (
                                <img
                                    ref={imgRef}
                                    src={imageUrl}
                                    alt="Document original source"
                                    style={{ transform: `scale(${zoom})` }}
                                    draggable={false}
                                />
                            )}
                            <div className="review-modal__zoom-controls">
                                <button onClick={handleZoomOut} aria-label="Dézoomer">-</button>
                                <button onClick={handleResetZoom} aria-label="Taille originale">1:1</button>
                                <button onClick={handleZoomIn} aria-label="Zoomer">+</button>
                            </div>
                        </div>
                    </div>

                    <div className="review-modal__bottom-panel" style={{ width: '100%' }}>
                        <div className="review-modal__students-mapping">
                            <h3 className="review-modal__panel-title">Correspondance des paiements</h3>
                            <div className="review-modal__panel-desc">
                                {rows.length} lignes extraites ({rows.filter(r => r.matchedStudentId).length} élèves identifiés).
                                {rows.filter(r => !r.matchedStudentId).length > 0 && (
                                    <div className="review-modal__unmatched-list">
                                        <strong>⚠️ À lier manuellement :</strong> {rows.filter(r => !r.matchedStudentId).map(r => r.nom || 'Inconnu').join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="review-modal__data-list" style={{ overflowX: 'auto' }}>
                                <table className="review-modal__data-table_validSubjects" style={{ width: '100%', minWidth: '800px' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 8px' }}>Texte lu (IA)</th>
                                            <th style={{ textAlign: 'left', padding: '12px 8px', width: '25%' }}>Élève Officiel</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', width: '15%' }}>Date Paiement (Optionnel)</th>
                                            <th style={{ textAlign: 'right', padding: '12px 8px', width: '15%' }}>Argent Versé (F)</th>
                                            <th style={{ textAlign: 'right', padding: '12px 8px', width: '15%' }}>Riz Versé (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => {
                                            const isDuplicateStudent = rows.filter(r => r.matchedStudentId === row.matchedStudentId && r.matchedStudentId !== null).length > 1;

                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td className={`ocr-name-cell ${!row.matchedStudentId ? '--warning' : ''}`} style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        🔍 {row.nom || "Illisible"}
                                                        {!row.matchedStudentId && <span className="unmatched-warning" title="Non lié" style={{ marginLeft: '8px' }}>⚠️</span>}
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        <select
                                                            className={`review-modal__select-subject ${!row.matchedStudentId ? '--error' : ''} ${isDuplicateStudent ? '--warning' : ''}`}
                                                            value={row.matchedStudentId || ""}
                                                            onChange={(e) => handleRowChange(index, 'matchedStudentId', e.target.value)}
                                                            style={{ width: '100%', padding: '6px' }}
                                                        >
                                                            <option value="">-- Lier à un élève --</option>
                                                            {students.map(s => (
                                                                <option key={s._id} value={s._id}>
                                                                    {s.nom} {Array.isArray(s.prenoms) ? s.prenoms[0] : s.prenoms}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isDuplicateStudent && <div style={{ color: 'orange', fontSize: '0.8em', marginTop: '4px' }}>⚠️ Cet élève est sélectionné plusieurs fois</div>}
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="date"
                                                            value={row.date || ""}
                                                            onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="100"
                                                            value={row.argent !== undefined ? row.argent : ""}
                                                            onChange={(e) => handleRowChange(index, 'argent', e.target.value ? Number(e.target.value) : 0)}
                                                            style={{ width: '100%', padding: '6px', textAlign: 'right', boxSizing: 'border-box' }}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={row.riz !== undefined ? row.riz : ""}
                                                            onChange={(e) => handleRowChange(index, 'riz', e.target.value ? Number(e.target.value) : 0)}
                                                            style={{ width: '100%', padding: '6px', textAlign: 'right', boxSizing: 'border-box' }}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
