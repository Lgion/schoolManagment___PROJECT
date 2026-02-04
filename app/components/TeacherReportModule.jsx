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

            {/* Bouton de toggle pour les profs/admins */}
            {canPostReport && (
                <div style={{ marginBottom: '1rem' }}>
                    <button
                        className={`teacher-report-toggle-btn ${isFormOpen ? '--open' : ''}`}
                        onClick={() => setIsFormOpen(!isFormOpen)}
                    >
                        {isFormOpen ? '✖ Annuler' : '📝 Écrire un rapport'}
                    </button>
                </div>
            )}

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
                                        <span className="teacher-report-badge --date">
                                            {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                        <span className="teacher-report-badge --classe">
                                            {report.classeLabel}
                                        </span>
                                    </div>
                                    <h4 className="teacher-report-card__author">{report.teacherName}</h4>
                                    <p className="teacher-report-card__snippet">
                                        {report.content.length > 100 ? report.content.substring(0, 100) + '...' : report.content}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {allReports.length > 1 && !showAllReports && (
                            <button
                                className="teacher-reports-more-btn"
                                onClick={() => setShowAllReports(true)}
                            >
                                Plus de rapports ? ({allReports.length - 1} restants)
                            </button>
                        )}
                        {showAllReports && (
                            <button
                                className="teacher-reports-more-btn --less"
                                onClick={() => setShowAllReports(false)}
                            >
                                Réduire
                            </button>
                        )}
                    </>
                ) : (
                    <p className="teacher-reports-empty">Aucun rapport disponible.</p>
                )}
            </div>

            {/* Modal de lecture */}
            {selectedReport && (
                <div className="teacher-report-modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="teacher-report-modal" onClick={e => e.stopPropagation()}>
                        <button className="teacher-report-modal__close" onClick={() => setSelectedReport(null)}>✕</button>
                        <div className="teacher-report-modal__header">
                            <span className="teacher-report-badge --date">
                                {new Date(selectedReport.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="teacher-report-badge --classe">
                                {selectedReport.classeLabel} ({selectedReport.classeAnnee})
                            </span>
                        </div>
                        <h3 className="teacher-report-modal__title">Rapport de {selectedReport.teacherName}</h3>
                        <div className="teacher-report-modal__content">
                            {selectedReport.content}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .teacher-report-section {
                    margin: 1rem 0;
                    width: 100%;
                }
                .teacher-report-toggle-btn {
                    padding: 0.6rem 1.2rem;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 20px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .teacher-report-toggle-btn.--open {
                    background: #e74c3c;
                }
                .teacher-report-form-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    border: 1px solid #eee;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .teacher-report-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .teacher-report-select, .teacher-report-textarea {
                    width: 100%;
                    padding: 0.8rem;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    font-size: 0.95rem;
                }
                .teacher-report-submit-btn {
                    padding: 0.8rem;
                    background: #2ecc71;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .teacher-report-status {
                    padding: 0.7rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .teacher-report-status.--success { background: #d4edda; color: #155724; }
                .teacher-report-status.--error { background: #f8d7da; color: #721c24; }
                
                .teacher-reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .teacher-report-card {
                    background: rgba(255,255,255,0.7);
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(0,0,0,0.05);
                    border-radius: 10px;
                    padding: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .teacher-report-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    background: white;
                }
                .teacher-report-card__header {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.8rem;
                }
                .teacher-report-badge {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-weight: 600;
                }
                .teacher-report-badge.--date { background: #f0f0f0; color: #666; }
                .teacher-report-badge.--classe { background: #e3f2fd; color: #1976d2; }
                
                .teacher-report-card__author {
                    margin: 0 0 0.5rem 0;
                    font-size: 1rem;
                    color: #333;
                }
                .teacher-report-card__snippet {
                    font-size: 0.9rem;
                    color: #666;
                    line-height: 1.4;
                }
                
                .teacher-reports-more-btn {
                    display: block;
                    width: 100%;
                    margin-top: 1.5rem;
                    padding: 0.7rem;
                    background: transparent;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    color: #888;
                    cursor: pointer;
                    font-weight: 500;
                }
                .teacher-reports-more-btn:hover {
                    border-color: #3498db;
                    color: #3498db;
                }

                .teacher-report-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(3px);
                }
                .teacher-report-modal {
                    background: white;
                    width: 90%;
                    max-width: 600px;
                    border-radius: 15px;
                    padding: 2rem;
                    position: relative;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .teacher-report-modal__close {
                    position: absolute;
                    top: 1rem; right: 1rem;
                    background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;
                }
                .teacher-report-modal__header {
                    display: flex;
                    gap: 0.8rem;
                    margin-bottom: 1rem;
                }
                .teacher-report-modal__title {
                    margin: 0 0 1.5rem 0;
                    color: #2c3e50;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 0.5rem;
                }
                .teacher-report-modal__content {
                    font-size: 1.05rem;
                    line-height: 1.6;
                    color: #444;
                    white-space: pre-wrap;
                }
            `}</style>
        </div>
    );
}
