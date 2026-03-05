import React, { useState, useEffect, useRef } from 'react';
import '../../assets/scss/components/MODALS/reviewModal.scss';
import ReviewCell from './ReviewCell';

export default function ReviewModal({ file, extractedData, onClose, onValidate }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    // NFR-PERF-1: Utilizing a ref for mutable localized data without forcing parent re-renders
    const editedDataRef = useRef(extractedData ? [...extractedData] : []);

    // Synchronize ref if extractedData changes
    useEffect(() => {
        if (extractedData) {
            editedDataRef.current = [...extractedData];
        }
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

    const handleRowChange = (index, updatedRow) => {
        editedDataRef.current[index] = updatedRow;
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
                            Fermer l'aperçu
                        </button>
                        <button
                            className="review-modal__btn-validate"
                            onClick={() => onValidate(editedDataRef.current)}
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
                        <div className="review-modal__panel-header">
                            <h3>Données extraites</h3>
                            <p>{extractedData.length} notes reconnues depuis l'image</p>
                        </div>

                        <div className="review-modal__data-list">
                            <table className="review-modal__data-table">
                                <thead>
                                    <tr>
                                        <th>Élève (Texte reconnu)</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractedData.map((row, index) => (
                                        <ReviewCell
                                            key={index}
                                            index={index}
                                            row={row}
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
    );
}
