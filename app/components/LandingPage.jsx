"use client";

import React, { useState } from 'react';

export default function LandingPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [schoolType, setSchoolType] = useState('classique');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const enterGeneralDemo = () => {
        document.cookie = "force_falsy=true; path=/; max-age=86400";
        document.cookie = "is_landing_demo=true; path=/; max-age=86400";
        document.cookie = "x-school-key=ecole_st_martin; path=/; max-age=86400";
        document.cookie = "mock_role=admin; path=/; max-age=86400";
        window.location.reload();
    };

    const handleCreateSandbox = async (e) => {
        e.preventDefault();
        if (!schoolName.trim()) return;

        setCreating(true);
        setError('');

        try {
            const response = await fetch('/api/sandbox/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: schoolName.trim(),
                    type: schoolType
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Le cookie et la redirection sont gérés par la réponse API
                window.location.reload();
            } else {
                setError(data.error || 'Erreur lors de la création de la sandbox.');
            }
        } catch (err) {
            setError('Impossible de se connecter au serveur de démonstration.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="landing">
            <style jsx global>{`
                .landing {
                    background: #090d16;
                    color: #f8fafc;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    min-height: 100vh;
                    position: relative;
                    overflow: hidden;
                }

                /* Glowing backgrounds */
                .landing::before {
                    content: '';
                    position: absolute;
                    top: -10%;
                    left: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
                    z-index: 0;
                    pointer-events: none;
                }

                .landing::after {
                    content: '';
                    position: absolute;
                    bottom: -10%;
                    right: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
                    z-index: 0;
                    pointer-events: none;
                }

                .landing__hero {
                    position: relative;
                    padding: 120px 20px 80px 20px;
                    text-align: center;
                    z-index: 1;
                }

                .landing__title {
                    font-size: 3.5rem;
                    font-weight: 900;
                    line-height: 1.15;
                    margin-bottom: 24px;
                    letter-spacing: -0.02em;
                }

                .landing__highlight {
                    background: linear-gradient(90deg, #f97316 0%, #ffedd5 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .landing__subtitle {
                    font-size: 1.25rem;
                    color: #94a3b8;
                    max-width: 650px;
                    margin: 0 auto 40px auto;
                    line-height: 1.6;
                }

                .landing__btn-group {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .landing__btn {
                    padding: 16px 32px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1.05rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    border: none;
                }

                .landing__btn--glow {
                    background: #f97316;
                    color: #fff;
                    box-shadow: 0 0 30px rgba(249, 115, 22, 0.3);
                }

                .landing__btn--glow:hover {
                    background: #ea580c;
                    transform: translateY(-2px);
                    box-shadow: 0 0 40px rgba(249, 115, 22, 0.5);
                }

                .landing__btn--secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: #f8fafc;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(12px);
                }

                .landing__btn--secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                /* Cards Grid */
                .landing__section {
                    padding: 80px 20px;
                    position: relative;
                    z-index: 1;
                }

                .landing__container {
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .landing__section-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    text-align: center;
                    margin-bottom: 48px;
                }

                .landing__grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 32px;
                }

                .landing__card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(12px);
                    padding: 32px;
                    border-radius: 20px;
                    transition: transform 0.3s, border-color 0.3s;
                }

                .landing__card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(249, 115, 22, 0.2);
                }

                .landing__card-icon {
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                }

                .landing__card h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                }

                .landing__card p {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin: 0;
                }

                /* Custom Modal */
                .landing-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(5, 8, 15, 0.85);
                    backdrop-filter: blur(12px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                .landing-modal__content {
                    background: linear-gradient(135deg, #131b2e 0%, #0b0f19 100%);
                    border: 1px solid rgba(249, 115, 22, 0.2);
                    padding: 40px;
                    border-radius: 28px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .landing-modal__title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                    color: #f8fafc;
                }

                .landing-modal__subtitle {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-bottom: 24px;
                }

                .landing-modal__form-group {
                    margin-bottom: 20px;
                    text-align: left;
                }

                .landing-modal__label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #cbd5e1;
                    margin-bottom: 6px;
                }

                .landing-modal__input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #f8fafc;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }

                .landing-modal__input:focus {
                    outline: none;
                    border-color: #f97316;
                }

                .landing-modal__select {
                    width: 100%;
                    padding: 12px 16px;
                    background: #131b2e;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #f8fafc;
                    font-size: 0.95rem;
                }

                .landing-modal__btn-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 28px;
                }

                .landing-modal__btn {
                    flex: 1;
                    padding: 14px;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .landing-modal__btn--submit {
                    background: #f97316;
                    color: #fff;
                }

                .landing-modal__btn--submit:hover:not(:disabled) {
                    background: #ea580c;
                }

                .landing-modal__btn--cancel {
                    background: rgba(255, 255, 255, 0.05);
                    color: #94a3b8;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .landing-modal__btn--cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleUp {
                    from { transform: scale(0.95) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>

            {/* HERO */}
            <section className="landing__hero">
                <h1 className="landing__title">
                    La Gestion Scolaire, <br/>
                    <span className="landing__highlight">Réinventée en SaaS.</span>
                </h1>
                <p className="landing__subtitle">
                    Une solution moderne, ultra-rapide et intuitive. Simulez instantanément différents rôles ou créez votre propre bac à sable en un clic.
                </p>
                <div className="landing__btn-group">
                    <button className="landing__btn landing__btn--glow" onClick={enterGeneralDemo}>
                        Démo Générale (Admin)
                    </button>
                    <button className="landing__btn landing__btn--secondary" onClick={() => setShowCreateModal(true)}>
                        🧪 Créer ma Sandbox Perso
                    </button>
                </div>
            </section>

            {/* SECTIONS FEATURE */}
            <section className="landing__section">
                <div className="landing__container">
                    <h2 className="landing__section-title">Pourquoi choisir notre solution SaaS ?</h2>
                    <div className="landing__grid">
                        <div className="landing__card">
                            <div className="landing__card-icon">⚡</div>
                            <h3>Vitesse Absolue</h3>
                            <p>Des temps de chargement réduits à zéro et des transitions ultra-fluides basées sur les meilleures pratiques Next.js.</p>
                        </div>
                        <div className="landing__card">
                            <div className="landing__card-icon">🧠</div>
                            <h3>Extraction IA Révolutionnaire</h3>
                            <p>Numérisez instantanément vos cahiers de texte, notes d'élèves et bordereaux financiers d'une simple capture photo.</p>
                        </div>
                        <div className="landing__card">
                            <div className="landing__card-icon">🛡️</div>
                            <h3>Multi-Tenant Hermétique</h3>
                            <p>Vos données de production et vos environnements de test sont isolés dynamiquement au niveau de la base de données.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CREATE SANDBOX MODAL */}
            {showCreateModal && (
                <div className="landing-modal" onClick={() => setShowCreateModal(false)}>
                    <div className="landing-modal__content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="landing-modal__title">Créer votre Sandbox 🧪</h3>
                        <p className="landing-modal__subtitle">
                            Configurez et initialisez un espace d'école factice pour tester l'ensemble de l'application.
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateSandbox}>
                            <div className="landing-modal__form-group">
                                <label className="landing-modal__label">Nom de votre école fictive</label>
                                <input
                                    type="text"
                                    className="landing-modal__input"
                                    placeholder="ex: Hogwarts Académie"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    required
                                    disabled={creating}
                                />
                            </div>

                            <div className="landing-modal__form-group">
                                <label className="landing-modal__label">Type d'établissement & Thème de seeding</label>
                                <select
                                    className="landing-modal__select"
                                    value={schoolType}
                                    onChange={(e) => setSchoolType(e.target.value)}
                                    disabled={creating}
                                >
                                    <option value="classique">🏫 Primaire Classique (CP-A, CE1-B)</option>
                                    <option value="scientifique">⚛️ Scientifique (Turing, Newton)</option>
                                    <option value="magique">🧙‍♂️ École de Magie (Gryffondor, Serpentard)</option>
                                </select>
                            </div>

                            <div className="landing-modal__btn-group">
                                <button
                                    type="button"
                                    className="landing-modal__btn landing-modal__btn--cancel"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="landing-modal__btn landing-modal__btn--submit"
                                    disabled={creating || !schoolName.trim()}
                                >
                                    {creating ? 'Création en cours...' : 'Initialiser mon Espace'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
