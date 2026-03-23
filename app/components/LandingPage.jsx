"use client";

import React from 'react';

export default function LandingPage() {

    const enterDemoMode = () => {
        document.cookie = "force_falsy=true; path=/; max-age=86400";
        document.cookie = "is_landing_demo=true; path=/; max-age=86400";
        window.location.reload();
    };

    return (
        <div className="landing">
            {/* HER0 - Parallax 1 */}
            <section className="landing__hero">
                <div className="landing__hero-overlay">
                    <h1 className="landing__title">La Gestion Scolaire, <br/><span className="landing__highlight">Réinventée.</span></h1>
                    <p className="landing__subtitle">
                        Une solution moderne, fluide et sans stress pour les administrateurs, les enseignants et les parents.
                    </p>
                    <button className="landing__btn landing__btn--glow" onClick={enterDemoMode}>
                        Découvrir la Démo Interactive
                    </button>
                </div>
            </section>

            {/* SECTION 2 - Problématique */}
            <section className="landing__section landing__section--light">
                <div className="landing__container">
                    <h2 className="landing__section-title">Pourquoi changer d'outil ?</h2>
                    <div className="landing__grid">
                        <div className="landing__card landing__card--alert">
                            <div className="landing__card-icon">⚠️</div>
                            <h3>Les Usines à Gaz</h3>
                            <p>Les logiciels classiques (comme Pronote ou EcoleDirecte) sont devenus de véritables usines à gaz, intégrant des dizaines de modules souvent inutiles pour le primaire.</p>
                        </div>
                        <div className="landing__card landing__card--alert">
                            <div className="landing__card-icon">🧠</div>
                            <h3>Surcharge Mentale</h3>
                            <p>Des interfaces "Old School", surchargées et anxiogènes, qui découragent les parents et font perdre du temps aux enseignants.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 - Parallax 2 - Nos solutions */}
            <section className="landing__parallax landing__parallax--features">
                <div className="landing__parallax-content">
                    <h2>Pensé pour l'humain, pas pour la machine.</h2>
                    <p>Notre interface a été conçue pour offrir la meilleure expérience utilisateur (UX/UI) du marché.</p>
                </div>
            </section>

            {/* SECTION 4 - Features */}
            <section className="landing__section landing__section--dark">
                <div className="landing__container">
                    <div className="landing__grid">
                        <div className="landing__card">
                            <div className="landing__card-icon">👨‍🎓</div>
                            <h3>Dossiers Centralisés</h3>
                            <p>Suivez les élèves, leur scolarité et leurs absences d'un simple coup d'œil, sans vous perdre dans les menus.</p>
                        </div>
                        <div className="landing__card">
                            <div className="landing__card-icon">📊</div>
                            <h3>Finances Simplifiées</h3>
                            <p>Fini les tableaux Excel. Un système de suivi des paiements intuitif et dynamique.</p>
                        </div>
                        <div className="landing__card">
                            <div className="landing__card-icon">🚀</div>
                            <h3>Performances</h3>
                            <p>Une technologie de pointe qui réagit instantanément, sans aucun temps de chargement frustrant.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 5 - CTA / Footer */}
            <section className="landing__cta">
                <h2>Prêt à moderniser votre établissement ?</h2>
                <p>N'attendez plus. Rejoignez la révolution de la vie scolaire.</p>
                <button className="landing__btn landing__btn--large" onClick={enterDemoMode}>
                    Tester l'Application Maintennant
                </button>
            </section>
        </div>
    );
}
