import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../../assets/scss/components/MODALS/reviewModal.scss';
import ReviewCell from './ReviewCell';

export default function ReviewModal({ file, extractedData, students = [], subjects = [], coefficients = {}, onClose, onValidate }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    const [rows, setRows] = useState([]);
    // État pour le mapping centralisé des matières { rawOcrName: officialId }
    const [subjectMapping, setSubjectMapping] = useState({});

    // Liste filtrée des matières de la classe (uniquement celles avec coeff)
    const classSubjects = useMemo(() => {
        return subjects.filter(s => coefficients[s.id] !== undefined);
    }, [subjects, coefficients]);

    // Algorithme de matching initial
    useEffect(() => {
        if (!extractedData) return;

        // 1. Extraire les noms de matières uniques détectés par l'IA
        const ocrSubjects = new Set();
        extractedData.forEach(item => {
            (item.notes || []).forEach(n => {
                if (n.matiere) ocrSubjects.add(n.matiere);
            });
        });

        // 2. Tenter un matching automatique pour la table de correspondance unique
        const initialMapping = {};
        ocrSubjects.forEach(ocrName => {
            const bestSubMatch = classSubjects.find(s =>
                s.nom.toLowerCase().includes(ocrName.toLowerCase()) ||
                ocrName.toLowerCase().includes(s.nom.toLowerCase())
            );
            initialMapping[ocrName] = bestSubMatch ? bestSubMatch.id : "";
        });
        setSubjectMapping(initialMapping);

        // 3. Préparer les lignes d'élèves (matching élèves seulement ici)
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
    }, [extractedData, students, classSubjects]);

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

    const handleSubjectMapChange = (ocrName, officialId) => {
        setSubjectMapping(prev => ({ ...prev, [ocrName]: officialId }));
    };

    const handleRowChange = (index, updatedRow) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = updatedRow;
            return next;
        });
    };

    const triggerValidation = () => {
        // Fusionner le mapping centralisé des matières dans les données avant validation
        const finalData = rows.map(row => ({
            ...row,
            notes: (row.notes || []).map(n => ({
                ...n,
                matchedMatiereId: subjectMapping[n.matiere] || null
            }))
        }));
        onValidate(finalData);
    };

    if (!file || !extractedData) {
        return null;
    }

    return (
        <div
            className="review-modal --inline"
            role="region"
            aria-labelledby="review-modal-title"
            ref={containerRef}
        >
            <div className="review-modal__container">
                <header className="review-modal__header">
                    <h2 id="review-modal-title">
                        <span>✨</span> Vérification de la Saisie Magique
                    </h2>
                    <div className="review-modal__header-actions">
                        <button
                            className="review-modal__btn-cancel"
                            onClick={onClose}
                        >
                            Fermer
                        </button>
                        <button
                            className="review-modal__btn-validate"
                            onClick={triggerValidation}
                            disabled={Object.values(subjectMapping).some(val => !val)}
                        >
                            Valider & Publier
                        </button>
                    </div>
                </header>

                <div className="review-modal__body">
                    <div className="review-modal__left-panel">
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

                    <div className="review-modal__right-panel">
                        {/* 1. TABLE DE CORRESPONDANCE DES MATIÈRES CENTRALISÉE */}
                        <div className="review-modal__subjects-mapping">
                            <h3 className="review-modal__panel-title">1. Correspondance des matières</h3>
                            <p className="review-modal__panel-desc">Liez les noms lus par l'IA aux matières de la classe.</p>
                            <table className="review-modal__data-table_validSubjects">
                                <thead>
                                    <tr>
                                        <th>Texte lu (IA)</th>
                                        <th>Matière officielle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(subjectMapping).map(ocrName => (
                                        <tr key={ocrName}>
                                            <td className="ocr-name-cell">🔍 {ocrName}</td>
                                            <td>
                                                <select
                                                    className={`review-modal__select-subject ${!subjectMapping[ocrName] ? '--error' : ''}`}
                                                    value={subjectMapping[ocrName]}
                                                    onChange={(e) => handleSubjectMapChange(ocrName, e.target.value)}
                                                >
                                                    <option value="">-- Sélectionner la matière --</option>
                                                    {classSubjects.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nom}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. TABLE DES ÉLÈVES ET NOTES */}
                        <div className="review-modal__students-mapping">
                            <h3 className="review-modal__panel-title">2. Correspondance des élèves et notes</h3>
                            <p className="review-modal__panel-desc">{rows.length} lignes extraites ({rows.filter(r => r.matchedStudentId).length} identifiés)</p>
                            <div className="review-modal__data-list">
                                <table className="review-modal__data-table_students">
                                    <thead>
                                        <tr>
                                            <th>Texte OCR</th>
                                            <th>Correspondance Élève</th>
                                            <th>Notes extraites</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => (
                                            <ReviewCell
                                                key={index}
                                                index={index}
                                                row={row}
                                                students={students}
                                                onChange={handleRowChange}
                                            />
                                        ))}
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
