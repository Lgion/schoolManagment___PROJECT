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

    const handleSubjectMapChange = (ocrName, officialId) => {
        // Empêcher d'assigner la même matière officielle à deux colonnes OCR différentes
        if (officialId !== "") {
            const alreadyUsed = Object.entries(subjectMapping).some(([name, id]) => id === officialId && name !== ocrName);
            if (alreadyUsed) {
                alert("Cette matière officielle est déjà liée à une autre colonne du document. Veuillez choisir une matière différente.");
                return;
            }
        }
        setSubjectMapping(prev => ({ ...prev, [ocrName]: officialId }));
    };

    const handleRowChange = (index, updatedRow) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = updatedRow;
            return next;
        });
    };

    const [isReduced, setIsReduced] = useState(false);

    const triggerValidation = () => {
        // 1. Vérifier doublons Matières
        const selectedMatieres = Object.values(subjectMapping).filter(Boolean);
        const duplicateSubjectIds = selectedMatieres.filter((id, index) => selectedMatieres.indexOf(id) !== index);

        if (duplicateSubjectIds.length > 0) {
            const duplicateNames = [...new Set(duplicateSubjectIds.map(id => {
                const sub = classSubjects.find(s => s.id === id);
                return sub ? sub.nom : id;
            }))];
            alert(`⚠️ Erreur : Les matières suivantes sont liées plusieurs fois : ${duplicateNames.join(', ')}. Veuillez corriger les doublons avant de valider.`);
            return;
        }

        // 2. Vérifier doublons Élèves
        const selectedStudentIds = rows.map(r => r.matchedStudentId).filter(Boolean);
        const duplicateStudentIds = selectedStudentIds.filter((id, index) => selectedStudentIds.indexOf(id) !== index);

        if (duplicateStudentIds.length > 0) {
            const duplicateNames = [...new Set(duplicateStudentIds.map(id => {
                const stu = students.find(s => s._id === id);
                return stu ? `${stu.nom} ${Array.isArray(stu.prenoms) ? stu.prenoms[0] : stu.prenoms}` : id;
            }))];
            alert(`⚠️ Erreur : Les élèves suivants ont été liés à plusieurs lignes : ${duplicateNames.join(', ')}. Chaque élève ne peut apparaître qu'une seule fois.`);
            return;
        }

        // 3. Vérifier que tout est lié
        const allSubjectsMapped = Object.values(subjectMapping).every(val => !!val);
        const allStudentsMapped = rows.every(r => !!r.matchedStudentId);

        if (!allSubjectsMapped || !allStudentsMapped) {
            alert("⚠️ Attention : Certaines matières ou certains élèves ne sont pas encore réconciliés.");
            return;
        }

        // Fusionner le mapping centralisé des matières dans les données avant validation
        const finalData = rows.map(row => ({
            ...row,
            notes: (row.notes || []).map(n => ({
                ...n,
                matchedMatiereId: subjectMapping[n.matiere] || null
            }))
        }));

        onValidate(finalData);
        setIsReduced(true); // Au lieu de fermer, on réduit
    };

    if (!file || !extractedData) {
        return null;
    }

    if (isReduced) {
        return (
            <div className="review-modal --reduced-banner" onClick={() => setIsReduced(false)}>
                <div className="review-modal__reduced-content">
                    <span>✨ L'analyse IA a été validée et les notes ont été pré-remplies ci-dessous.</span>
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
                            Abandonner
                        </button>
                        <button
                            className="review-modal__btn-validate"
                            onClick={triggerValidation}
                            title="Valider la correspondance et pré-remplir la grille de saisie"
                        >
                            Valider & Pré-remplir
                        </button>
                    </div>
                </header>

                <div className="review-modal__body">
                    <div className="review-modal__above-panel">
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

                    <div className="review-modal__bottom-panel">
                        {/* 1. TABLE DE CORRESPONDANCE DES MATIÈRES CENTRALISÉE */}
                        <div className="review-modal__subjects-mapping">
                            <h3 className="review-modal__panel-title">1. Correspondance des matières</h3>
                            <p className="review-modal__panel-desc">Liez les noms lus par l'IA aux matières de la classe.</p>
                            <div className="review-modal__data-list">
                                <table className="review-modal__data-table_validSubjects">
                                    <thead>
                                        <tr>
                                            <th>Texte lu (IA)</th>
                                            <th>Matière officielle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(subjectMapping).map(ocrName => {
                                            const isDuplicate = Object.values(subjectMapping).filter(id => id === subjectMapping[ocrName] && id !== "").length > 1;
                                            return (
                                                <tr key={ocrName}>
                                                    <td className={`ocr-name-cell ${isDuplicate ? '--warning' : ''}`}>
                                                        🔍 {ocrName}
                                                        {isDuplicate && <span className="duplicate-warning" title="Doublon détecté">⚠️</span>}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={`review-modal__select-subject ${!subjectMapping[ocrName] ? '--error' : ''} ${isDuplicate ? '--warning' : ''}`}
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
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. TABLE DES ÉLÈVES ET NOTES */}
                        <div className="review-modal__students-mapping">
                            <h3 className="review-modal__panel-title">2. Correspondance des élèves et notes</h3>
                            <div className="review-modal__panel-desc">
                                {rows.length} lignes extraites ({rows.filter(r => r.matchedStudentId).length} identifiés).
                                {rows.filter(r => !r.matchedStudentId).length > 0 && (
                                    <div className="review-modal__unmatched-list">
                                        <strong>⚠️ À lier manuellement :</strong> {rows.filter(r => !r.matchedStudentId).map(r => r.nom || 'Inconnu').join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="review-modal__data-list">
                                {rows.map((row, index) => (
                                    <ReviewCell
                                        key={index}
                                        index={index}
                                        row={row}
                                        students={students}
                                        onChange={handleRowChange}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
