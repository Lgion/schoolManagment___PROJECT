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
        if (!Array.isArray(classes) || !teacherId) return [];

        const currentYearClasses = classes.filter(c => c.annee === currentSchoolYear);

        if (isAdmin()) return currentYearClasses;

        return currentYearClasses.filter(c => {
            const profs = Array.isArray(c.professeur) ? c.professeur : [];
            return profs.some(p => String(typeof p === 'object' ? p._id : p) === String(teacherId));
        });
    }, [classes, teacherId, isAdmin, currentSchoolYear]);

    // Récupérer tous les rapports (Filtrés par classe si initialClasseId est fourni)
    const allReports = useMemo(() => {
        if (!Array.isArray(classes)) return [];
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
        </div>
    );
}
