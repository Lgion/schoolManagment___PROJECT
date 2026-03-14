import React, { useState, useEffect, useRef, useContext } from 'react';
import '../../assets/scss/components/MODALS/reviewModal.scss';
import { AiAdminContext } from '../../../stores/ai_adminContext';

export default function ReviewFeesModal({ file, extractedData, students = [], onClose, onValidate }) {
    const { feeDefinitions, normalizeFeeItem } = useContext(AiAdminContext);
    const [imageUrl, setImageUrl] = useState(null);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef(null);
    const containerRef = useRef(null);
    const [isReduced, setIsReduced] = useState(false);

    const [rows, setRows] = useState([]);

    // Algorithme de matching initial + normalization des données extraites
    useEffect(() => {
        if (!extractedData) return;

        const matched = extractedData.map(item => {
            const rawName = (item.nom || "").toLowerCase().trim();
            const bestMatch = students.find(s => {
                const sNom = (s.nom || "").toLowerCase();
                const sPrenom = (Array.isArray(s.prenoms) ? s.prenoms[0] : s.prenoms || "").toLowerCase();
                return rawName.includes(sNom) || rawName.includes(sPrenom) || sNom.includes(rawName);
            });

            // Normalize AI-extracted data: convert legacy keys to dynamic fees format
            const fees = {};
            feeDefinitions.forEach(def => {
                fees[def.id] = 0;
            });

            // Map the known AI response fields to fee definitions
            // The AI currently returns { argent, riz }, which maps to scol_cash and scol_nature
            const LEGACY_MAP = { 'argent': 'scol_cash', 'riz': 'scol_nature' };
            Object.entries(LEGACY_MAP).forEach(([key, feeId]) => {
                if (item[key] !== undefined && fees[feeId] !== undefined) {
                    fees[feeId] = Math.max(0, Number(item[key]) || 0);
                }
            });

            return {
                nom: item.nom,
                date: item.date || "",
                confiance: item.confiance,
                fees,
                matchedStudentId: bestMatch ? bestMatch._id : null
            };
        });
        setRows(matched);
    }, [extractedData, students, feeDefinitions]);

    useEffect(() => {
        setIsReduced(false);
    }, [extractedData]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleRowChange = (index, field, value) => {
        setRows(prev => {
            const next = [...prev];
            if (field === 'matchedStudentId' || field === 'date') {
                next[index] = { ...next[index], [field]: value };
            } else {
                // It's a fee field change
                next[index] = { ...next[index], fees: { ...next[index].fees, [field]: value } };
            }
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
            alert(`⚠️ Erreur : Les élèves suivants ont été liés à plusieurs lignes : ${duplicateNames.join(', ')}.`);
            return;
        }

        // 2. Vérifier que tout est lié
        const allStudentsMapped = rows.every(r => !!r.matchedStudentId);
        if (!allStudentsMapped) {
            alert("⚠️ Attention : Certains élèves du document n'ont pas encore été associés à un compte étudiant.");
            return;
        }

        // 3. Vérifier les montants négatifs
        const hasNegativeAmounts = rows.some(r => 
            feeDefinitions.some(def => r.fees[def.id] !== undefined && r.fees[def.id] < 0)
        );
        if (hasNegativeAmounts) {
            alert("⚠️ Erreur : Les montants ne peuvent pas être négatifs.");
            return;
        }

        // 4. Vérifier les paiements déjà complétés (100%)
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const anneeKey = month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

        let warnings = [];

        const finalRows = rows.map(r => {
            if (!r.matchedStudentId) return r;
            const stu = students.find(s => s._id === r.matchedStudentId);
            if (!stu) return r;

            const existingFees = stu.scolarity_fees_$_checkbox?.[anneeKey] || {};
            
            // Calculate existing totals per fee type
            const existingTotals = {};
            feeDefinitions.forEach(def => existingTotals[def.id] = 0);

            Object.values(existingFees).forEach(deposits => {
                const arr = Array.isArray(deposits) ? deposits : [deposits];
                arr.forEach(d => {
                    const normalized = normalizeFeeItem(d);
                    if (normalized && existingTotals[normalized.feeId] !== undefined) {
                        existingTotals[normalized.feeId] += normalized.amount;
                    }
                });
            });

            const nameStr = `${stu.nom || ''} ${Array.isArray(stu.prenoms) ? stu.prenoms[0] : (stu.prenoms || '')}`.trim();
            const skippedFees = {};

            feeDefinitions.forEach(def => {
                const target = def.targets[stu.isInterne ? 'interne' : 'externe'] || 0;
                if (r.fees[def.id] > 0 && existingTotals[def.id] >= target) {
                    warnings.push(`- ${nameStr} : ${def.label} déjà payé à 100% (${existingTotals[def.id]} ${def.unit}).`);
                    skippedFees[def.id] = 0;
                } else {
                    skippedFees[def.id] = r.fees[def.id];
                }
            });

            return { ...r, fees: skippedFees };
        });

        if (warnings.length > 0) {
            const proceed = window.confirm(`⚠️ Attention : Certains élèves ont déjà payé la totalité de leurs frais.\n\n${warnings.join('\n')}\n\nVoulez-vous continuer ?`);
            if (!proceed) return;
        }

        onValidate(finalRows);
        setIsReduced(true);
    };

    if (!file || !extractedData) return null;

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
                        <button className="review-modal__btn-cancel" onClick={onClose}>Abandonner</button>
                        <button className="review-modal__btn-validate" onClick={triggerValidation} title="Valider la correspondance et appliquer les paiements">Appliquer les Paiements</button>
                    </div>
                </header>

                <div className="review-modal__body" style={{ flexDirection: 'column' }}>
                    <div className="review-modal__above-panel" style={{ height: '30vh', minHeight: '200px' }}>
                        <div className="review-modal__image-container">
                            {imageUrl && (
                                <img ref={imgRef} src={imageUrl} alt="Document original source" style={{ transform: `scale(${zoom})` }} draggable={false} />
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
                                            <th style={{ textAlign: 'center', padding: '12px 8px', width: '12%' }}>Date</th>
                                            {feeDefinitions.map(def => (
                                                <th key={def.id} style={{ textAlign: 'right', padding: '12px 8px', width: `${Math.floor(40 / feeDefinitions.length)}%` }}>
                                                    {def.label} ({def.unit})
                                                </th>
                                            ))}
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
                                                    {feeDefinitions.map(def => (
                                                        <td key={def.id} style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={row.fees[def.id] !== undefined ? row.fees[def.id] : ""}
                                                                onChange={(e) => handleRowChange(index, def.id, e.target.value ? Number(e.target.value) : 0)}
                                                                style={{ width: '100%', padding: '6px', textAlign: 'right', boxSizing: 'border-box' }}
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    ))}
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

