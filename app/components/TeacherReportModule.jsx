"use client"

import { useState, useContext, useMemo } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { useUserRole } from '../../stores/useUserRole';
import PermissionGate from './PermissionGate';

/**
 * Composant de création et d'affichage de rapports
 */
export default function TeacherReportModule({ className = "", initialClasseId = "" }) {
    const { classes } = useContext(AiAdminContext);
    const { userRole, userData, isProf, isAdmin } = useUserRole();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClasseId, setSelectedClasseId] = useState(initialClasseId);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [showAllReports, setShowAllReports] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // Déterminer l'année scolaire en cours
    const currentSchoolYear = useMemo(() => {
        const now = new Date();
        return (now.getMonth() + 1) < 7
            ? `${now.getFullYear() - 1}-${now.getFullYear()}`
            : `${now.getFullYear()}-${now.getFullYear() + 1}`;
    }, []);

    const canPostReport = isProf() || isAdmin();
    const teacherId = userData?.roleData?.teacherRef?._id || userData?._id;
    const teacherName = `${userData?.firstName} ${userData?.lastName}`;

    // Classes pour le formulaire (Uniquement l'année en cours)
    const managedClasses = useMemo(() => {
        if (!classes || !teacherId) return [];

        const currentYearClasses = classes.filter(c => c.annee === currentSchoolYear);

        if (isAdmin()) return currentYearClasses;

        return currentYearClasses.filter(c => {
            const profs = Array.isArray(c.professeur) ? c.professeur : [];
            return profs.some(p => String(typeof p === 'object' ? p._id : p) === String(teacherId));
        });
    }, [classes, teacherId, isAdmin, currentSchoolYear]);

    // Récupérer tous les rapports (Filtrés par classe si initialClasseId est fourni)
    const allReports = useMemo(() => {
        if (!classes) return [];
        let reports = [];

        const targetClasses = initialClasseId
            ? classes.filter(c => String(c._id) === String(initialClasseId))
            : classes;

        targetClasses.forEach(c => {
            if (Array.isArray(c.reports)) {
                c.reports.forEach(r => {
                    reports.push({
                        ...r,
                        classeId: c._id,
                        classeLabel: `${c.niveau} ${c.alias}`,
                        classeAnnee: c.annee
                    });
                });
            }
        });

        // Trier par date décroissante
        return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [classes, initialClasseId]);

    const displayReports = showAllReports ? allReports : allReports.slice(0, 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClasseId || selectedClasseId === "placeholder") {
            setStatus({ type: 'error', message: 'Veuillez choisir une classe' });
            return;
        }
        if (!content.trim()) {
            setStatus({ type: 'error', message: 'Veuillez rédiger un contenu' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const response = await fetch(`/api/classes/${selectedClasseId}/add-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId,
                    teacherName,
                    content: content.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                setStatus({ type: 'success', message: 'Rapport enregistré !' });
                setContent('');
                if (!initialClasseId) setSelectedClasseId('');
                setTimeout(() => {
                    setIsFormOpen(false);
                    setStatus(null);
                    // On pourrait trigger un refresh via le contexte ici si nécessaire
                }, 1500);
            } else {
                throw new Error(result.error || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Erreur rapport:', error);
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`teacher-report-section ${className}`}>

            <div className="teacher-report-section-header">
                <h2 className="teacher-report-section-title">
                    <i className="fas fa-clipboard-list"></i>
                    Rapports d'activité
                </h2>

                {/* Bouton de toggle pour les profs/admins */}
                {canPostReport && (
                    <button
                        className={`teacher-report-toggle-btn ${isFormOpen ? '--open' : ''}`}
                        onClick={() => setIsFormOpen(!isFormOpen)}
                    >
                        {isFormOpen ? (
                            <><i className="fas fa-times"></i> Annuler</>
                        ) : (
                            <><i className="fas fa-pen-fancy"></i> Écrire un rapport</>
                        )}
                    </button>
                )}
            </div>

            {/* Formulaire de rapport */}
            {isFormOpen && (
                <div className="teacher-report-form-card">
                    <h3 className="teacher-report-form-title">Nouveau rapport</h3>
                    <form onSubmit={handleSubmit} className="teacher-report-form">
                        <select
                            className="teacher-report-select"
                            value={selectedClasseId}
                            onChange={(e) => setSelectedClasseId(e.target.value)}
                            disabled={!!initialClasseId || loading}
                        >
                            <option value="placeholder">-- Choisir une classe ({currentSchoolYear}) --</option>
                            {managedClasses.map(c => (
                                <option key={c._id} value={c._id}>{c.niveau} {c.alias}</option>
                            ))}
                        </select>

                        <textarea
                            className="teacher-report-textarea"
                            placeholder="Rédigez votre rapport..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={loading}
                            rows={4}
                        />

                        {status && (
                            <div className={`teacher-report-status --${status.type}`}>
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="teacher-report-submit-btn"
                            disabled={loading || !selectedClasseId || selectedClasseId === "placeholder" || !content.trim()}
                        >
                            {loading ? 'Envoi...' : 'Enregistrer le rapport'}
                        </button>
                    </form>
                </div>
            )}

            {/* Liste des rapports (visible pour tous) */}
            <div className="teacher-reports-list">
                {allReports.length > 0 ? (
                    <>
                        <div className="teacher-reports-grid">
                            {displayReports.map((report, idx) => (
                                <div
                                    key={`${report.classeId}-${idx}`}
                                    className="teacher-report-card"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    <div className="teacher-report-card__header">
                                        <div className="teacher-report-badges">
                                            <span className="teacher-report-badge --date">
                                                <i className="far fa-calendar-alt"></i>
                                                {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                            <span className="teacher-report-badge --classe">
                                                <i className="fas fa-graduation-cap"></i>
                                                {report.classeLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="teacher-report-card__body">
                                        <h4 className="teacher-report-card__author">
                                            <span className="author-icon">✍️</span>
                                            {report.teacherName}
                                        </h4>
                                        <div className="teacher-report-card__snippet-wrapper">
                                            <p className="teacher-report-card__snippet">
                                                {report.content.length > 120 ? report.content.substring(0, 120) + '...' : report.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="teacher-report-card__footer">
                                        <span className="read-more">Lire la suite <i className="fas fa-arrow-right"></i></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {allReports.length > 1 && !showAllReports && (
                            <div className="teacher-reports-actions">
                                <button
                                    className="teacher-reports-more-btn"
                                    onClick={() => setShowAllReports(true)}
                                >
                                    Consulter les {allReports.length - 1} autres rapports
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        )}
                        {showAllReports && (
                            <div className="teacher-reports-actions">
                                <button
                                    className="teacher-reports-more-btn --less"
                                    onClick={() => setShowAllReports(false)}
                                >
                                    Réduire la liste
                                    <i className="fas fa-chevron-up"></i>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="teacher-reports-empty">
                        <i className="fas fa-inbox"></i>
                        <p>Aucun rapport disponible pour le moment.</p>
                    </div>
                )}
            </div>

            {/* Modal de lecture */}
            {selectedReport && (
                <div className="teacher-report-modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="teacher-report-modal" onClick={e => e.stopPropagation()}>
                        <button className="teacher-report-modal__close" onClick={() => setSelectedReport(null)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="teacher-report-modal__header">
                            <span className="teacher-report-badge --date">
                                {new Date(selectedReport.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="teacher-report-badge --classe">
                                {selectedReport.classeLabel} ({selectedReport.classeAnnee})
                            </span>
                        </div>
                        <h3 className="teacher-report-modal__title">
                            Rapport de <span className="highlight">{selectedReport.teacherName}</span>
                        </h3>
                        <div className="teacher-report-modal__content">
                            {selectedReport.content}
                        </div>
                        <div className="teacher-report-modal__footer">
                            <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .teacher-report-section {
                    margin: 2rem 0;
                    width: 100%;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .teacher-report-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 1rem;
                }

                .teacher-report-section-title {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: -0.5px;
                }

                .teacher-report-section-title i {
                    color: #3498db;
                    background: #e3f2fd;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    font-size: 1.2rem;
                }

                .teacher-report-toggle-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.8rem 1.5rem;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                }

                .teacher-report-toggle-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
                    background: linear-gradient(135deg, #3fa9f5, #2980b9);
                }

                .teacher-report-toggle-btn.--open {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
                }

                .teacher-report-form-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 2rem;
                    margin-bottom: 2.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    animation: slideDown 0.4s ease-out;
                }

                @keyframes slideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .teacher-report-form-title {
                    margin-top: 0;
                    margin-bottom: 1.5rem;
                    font-size: 1.25rem;
                    color: #2c3e50;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .teacher-report-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                }

                .teacher-report-select, .teacher-report-textarea {
                    width: 100%;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid #e0e0e0;
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: white;
                }

                .teacher-report-select:focus, .teacher-report-textarea:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                }

                .teacher-report-submit-btn {
                    padding: 1rem;
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
                }

                .teacher-report-submit-btn:hover:not(:disabled) {
                    transform: scale(1.01);
                    box-shadow: 0 6px 15px rgba(46, 204, 113, 0.3);
                }

                .teacher-report-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    filter: grayscale(0.5);
                }

                .teacher-report-status {
                    padding: 1rem;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .teacher-report-status.--success { background: #e8f5e9; color: #2e7d32; border-left: 4px solid #2e7d32; }
                .teacher-report-status.--error { background: #ffebee; color: #c62828; border-left: 4px solid #c62828; }
                
                .teacher-reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }

                .teacher-report-card {
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                }

                .teacher-report-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 25px rgba(0,0,0,0.08);
                    border-color: #3498db;
                }

                .teacher-report-card__header {
                    padding: 1.25rem 1.25rem 0.75rem 1.25rem;
                }

                .teacher-report-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.6rem;
                }

                .teacher-report-badge {
                    font-size: 0.75rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 50px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .teacher-report-badge i { font-size: 0.8rem; }
                .teacher-report-badge.--date { background: #f8f9fa; color: #636e72; }
                .teacher-report-badge.--classe { background: #e3f2fd; color: #1976d2; }
                
                .teacher-report-card__body {
                    padding: 0 1.25rem 1rem 1.25rem;
                    flex-grow: 1;
                }

                .teacher-report-card__author {
                    margin: 0.5rem 0 0.75rem 0;
                    font-size: 1.1rem;
                    color: #2d3436;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .author-icon { font-size: 1.2rem; }

                .teacher-report-card__snippet-wrapper {
                    position: relative;
                }

                /* IMPORTANT: Désactivation explicite du drop-cap global */
                .teacher-report-card__snippet {
                    font-size: 0.95rem;
                    color: #636e72;
                    line-height: 1.6;
                    margin: 0;
                    text-align: left; /* Contrer le justify global si présent */
                    position: relative;
                    padding-left: 0 !important; /* Retirer le padding-left décoratif du parent */
                }

                .teacher-report-card__snippet::before {
                    display: none !important; /* Supprimer la bordure gauche décorative */
                }

                .teacher-report-card__snippet::first-letter {
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    float: none !important;
                    line-height: inherit !important;
                    margin: 0 !important;
                    color: inherit !important;
                    font-family: inherit !important;
                }
                
                .teacher-report-card__footer {
                    padding: 1rem 1.25rem;
                    background: #fbfbfc;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: flex-end;
                }

                .read-more {
                    font-size: 0.85rem;
                    color: #3498db;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: gap 0.2s;
                }

                .teacher-report-card:hover .read-more {
                    gap: 0.6rem;
                }

                .teacher-reports-actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 2rem;
                }

                .teacher-reports-more-btn {
                    padding: 0.75rem 2rem;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 50px;
                    color: #636e72;
                    cursor: pointer;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.3s;
                }

                .teacher-reports-more-btn:hover {
                    border-color: #3498db;
                    color: #3498db;
                    background: #f0f7ff;
                }

                .teacher-reports-more-btn.--less {
                    border-color: #fab1a0;
                    color: #e17055;
                }

                .teacher-reports-empty {
                    text-align: center;
                    padding: 3rem;
                    background: rgba(0,0,0,0.02);
                    border-radius: 20px;
                    border: 2px dashed #e0e0e0;
                    color: #b2bec3;
                }

                .teacher-reports-empty i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    display: block;
                }

                .teacher-report-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(8px);
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .teacher-report-modal {
                    background: white;
                    width: 95%;
                    max-width: 700px;
                    border-radius: 24px;
                    padding: 2.5rem;
                    position: relative;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                    animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modalScale { 
                    from { transform: scale(0.9); opacity: 0; } 
                    to { transform: scale(1); opacity: 1; } 
                }

                .teacher-report-modal__close {
                    position: absolute;
                    top: 1.5rem; right: 1.5rem;
                    background: #f1f2f6; 
                    border: none; 
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; 
                    color: #636e72;
                    transition: all 0.2s;
                }

                .teacher-report-modal__close:hover {
                    background: #dfe4ea;
                    color: #2f3542;
                    transform: rotate(90deg);
                }

                .teacher-report-modal__title {
                    margin: 1rem 0 1.5rem 0;
                    font-size: 1.75rem;
                    color: #2c3e50;
                }

                .highlight { color: #3498db; }

                .teacher-report-modal__content {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: #2f3542;
                    white-space: pre-wrap;
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                }

                .teacher-report-modal__footer {
                    display: flex;
                    justify-content: center;
                }

                .modal-close-btn {
                    padding: 0.8rem 2.5rem;
                    background: #f1f2f6;
                    border: none;
                    border-radius: 12px;
                    color: #2f3542;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .modal-close-btn:hover {
                    background: #dfe4ea;
                }

                @media (max-width: 600px) {
                    .teacher-reports-grid { grid-template-columns: 1fr; }
                    .teacher-report-modal { padding: 1.5rem; }
                    .teacher-report-modal__title { font-size: 1.4rem; }
                }
            `}</style>
        </div>
    );
}
