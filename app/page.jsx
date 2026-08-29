"use client"

import React, { useContext, useEffect, useState } from 'react';
import { AiAdminContext } from '../stores/ai_adminContext';
import { useUserRole } from '../stores/useUserRole';
import TeacherReportModule from './components/TeacherReportModule';
import TeacherDailyWidget from './components/TeacherDailyWidget';
import CalendarContent from './calendar/CalendarContent';
import UnifiedFeed from './components/feed/UnifiedFeed';
import { fetchUserWithRefs, studentFullName } from './components/family/familyApi';
import Link from 'next/link';
import PermissionGate from './components/PermissionGate';
import AppointmentsPanel from './components/appointments/AppointmentsPanel';

function classLabel(classes, classId) {
  if (!classId || !Array.isArray(classes)) return '';
  const c = classes.find((x) => String(x._id || x.id) === String(classId));
  return c ? `${c.niveau || ''} ${c.alias || ''}`.trim() : '';
}

export default function Page() {
  const { homepage, homepageLoaded, classes } = useContext(AiAdminContext);
  const { userRole, clerkUser, userData } = useUserRole();

  const [data, setData] = useState(null);
  const [loadingRefs, setLoadingRefs] = useState(true);

  useEffect(() => {
    let alive = true;
    if (clerkUser?.id && (userRole === 'parent' || userRole === 'eleve')) {
      (async () => {
        try {
          const u = await fetchUserWithRefs(clerkUser.id);
          if (alive) {
            setData(u);
            setLoadingRefs(false);
          }
        } catch (err) {
          console.error("Erreur de récupération des refs utilisateur:", err);
          if (alive) {
            setData(userData);
            setLoadingRefs(false);
          }
        }
      })();
    } else {
      setData(userData);
      setLoadingRefs(false);
    }
    return () => { alive = false; };
  }, [clerkUser, userData, userRole]);

  if (!homepageLoaded) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Chargement du portail...</div>;
  }

  const firstName = data?.firstName || userData?.firstName || '';
  const roleNameMap = {
    admin: 'Administrateur',
    enseignant: 'Enseignant',
    eleve: 'Élève',
    parent: 'Parent d\'élève'
  };

  // Parent specific calculations
  const children = data?.roleData?.childrenRefs || [];

  // Student specific calculations
  const eleve = data?.roleData?.eleveRef || null;
  const profileHref = eleve?._id ? `/eleves/${eleve._id}` : null;

  return (
    <div className="ecole-dashboard">
      {/* Hero Header Section */}
      <header className="ecole-dashboard-hero">
        {homepage.logoUrl && (
          <img src={homepage.logoUrl} alt="Logo" className="ecole-dashboard-hero__logo" />
        )}
        <div className="ecole-dashboard-hero__content">
          <h1 className="ecole-dashboard-hero__title">{homepage.title || 'Portail Éducatif'}</h1>
          {homepage.slogan && <p className="ecole-dashboard-hero__slogan">{homepage.slogan}</p>}
          <p className="ecole-dashboard-hero__welcome familyHome__title">
            {userRole === 'eleve' ? '🎒 Salut' : '👋 Bonjour'} {firstName || 'à vous'}, ravi de vous revoir. (Espace {roleNameMap[userRole] || 'Visiteur'})
          </p>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="ecole-dashboard-grid">
        {/* Left/Main Column */}
        <div className="ecole-dashboard-column">
          
          {/* Rôle PARENT: Liste des enfants */}
          {userRole === 'parent' && (
            <div className="familyHome familyHome--parent">
              <section className="ecole-card-dashboard">
                <h2 className="ecole-card-dashboard__title">🧒 Mes enfants</h2>
                {loadingRefs ? (
                  <p>Chargement des dossiers enfants...</p>
                ) : children.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                    Aucun enfant rattaché à votre compte. Contactez l'administration pour lier vos comptes par email.
                  </p>
                ) : (
                  <div className="ecole-parent-kids">
                    {children.map((child) => {
                      const cls = classLabel(classes, child.current_classe);
                      return (
                        <article key={child._id} className="ecole-kid-card">
                          <div className="ecole-kid-card__top">
                            <span className="ecole-kid-card__avatar">🧒</span>
                            <div>
                              <h3 className="ecole-kid-card__name">{studentFullName(child)}</h3>
                              {cls && <span className="ecole-kid-card__class">{cls}</span>}
                            </div>
                          </div>
                          <div className="ecole-kid-card__links">
                            <Link href={`/eleves/${child._id}`} className="ecole-kid-card__link-chip">📋 Profil & devoirs</Link>
                            <Link href={`/eleves/${child._id}`} className="ecole-kid-card__link-chip">💬 Messagerie</Link>
                            <Link href={`/eleves/${child._id}`} className="ecole-kid-card__link-chip">💶 Scolarité</Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Rôle PARENT: Rendez-vous */}
          {userRole === 'parent' && (
            <section className="ecole-card-dashboard">
              <h2 className="ecole-card-dashboard__title">📅 Mes rendez-vous</h2>
              <AppointmentsPanel initiatorRole="parent" canCreate={false} />
            </section>
          )}

          {/* Rôle ÉLÈVE: Liens rapides */}
          {userRole === 'eleve' && (
            <div className="familyHome familyHome--student">
              <section className="ecole-card-dashboard">
                <h2 className="ecole-card-dashboard__title">🚀 Mon Espace Élève</h2>
              {loadingRefs ? (
                <p>Chargement...</p>
              ) : !profileHref ? (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                  Votre profil élève n'est pas encore rattaché à ce compte autonome.
                </p>
              ) : (
                <div className="ecole-student-links">
                  <Link href={profileHref} className="ecole-student-link ecole-student-link--primary">📋 Mon Profil & Devoirs</Link>
                  <Link href={profileHref} className="ecole-student-link">💬 Messages Enseignant</Link>
                  <Link href="/games" className="ecole-student-link">🎮 Jeux pédagogiques</Link>
                </div>
              )}
            </section>
          </div>
        )}

          {/* Rôle ADMIN & ENSEIGNANT: Widget Tâches / Rapport Journalier */}
          {(userRole === 'admin' || userRole === 'enseignant') && (
            <>
              <TeacherDailyWidget />
              <TeacherReportModule />
            </>
          )}

          {/* Global: Annonces & Sondages (Visible pour tous) */}
          <section className="ecole-card-dashboard">
            <h2 className="ecole-card-dashboard__title">📢 Annonces & Sondages</h2>
            <div className="ecole-scrollable-widget">
              <UnifiedFeed contextType="global" />
            </div>
          </section>

        </div>

        {/* Right/Sidebar Column */}
        <div className="ecole-dashboard-column">
          
          {/* Global: Agenda de l'école (Visible pour tous) */}
          <section className="ecole-card-dashboard">
            <h2 className="ecole-card-dashboard__title">📅 Agenda Scolaire</h2>
            <div className="ecole-scrollable-widget">
              <CalendarContent embedded={true} />
            </div>
          </section>

          {/* Présentation / À propos */}
          {(homepage.texts && homepage.texts.length > 0) && (
            <section className="ecole-card-dashboard">
              <h2 className="ecole-card-dashboard__title">🏫 Notre Établissement</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {homepage.texts.map((text, i) => (
                  <p key={i} style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#334155', margin: 0 }}>
                    {text}
                  </p>
                ))}
                {homepage.photo && (
                  <img 
                    src={homepage.photo} 
                    alt="Illustration Établissement" 
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '200px', marginTop: '0.5rem' }} 
                  />
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}